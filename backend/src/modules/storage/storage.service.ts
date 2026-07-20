import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { dirname, isAbsolute, join } from "path";
import { randomUUID } from "crypto";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export type StorageDriver = "local" | "s3";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: StorageDriver;
  private readonly uploadRoot: string;
  private client: S3Client | null = null;
  private bucket = "";
  private region = "us-east-1";
  private bucketReady = false;

  constructor(private readonly config: ConfigService) {
    const configured = (this.config.get<string>("STORAGE_DRIVER") ?? "local").toLowerCase();
    this.driver = configured === "s3" ? "s3" : "local";

    const configuredDir =
      this.config.get<string>("UPLOAD_DIR") ?? join(process.cwd(), "uploads");
    this.uploadRoot = isAbsolute(configuredDir)
      ? configuredDir
      : join(process.cwd(), configuredDir);

    if (this.driver === "s3") {
      this.region =
        this.config.get<string>("S3_REGION") ||
        this.config.get<string>("AWS_REGION") ||
        "us-east-1";
      const forcePathStyle =
        (this.config.get<string>("S3_FORCE_PATH_STYLE") ?? "false").toLowerCase() ===
        "true";
      const endpoint =
        this.config.get<string>("S3_PUBLIC_ENDPOINT") ||
        this.config.get<string>("S3_ENDPOINT");
      this.bucket =
        this.config.get<string>("S3_BUCKET") ||
        this.config.get<string>("AWS_S3_BUCKET") ||
        "eof-talent-images";
      this.client = new S3Client({
        region: this.region,
        endpoint: endpoint || undefined,
        forcePathStyle,
        credentials: {
          accessKeyId:
            this.config.get<string>("S3_ACCESS_KEY") ||
            this.config.get<string>("AWS_ACCESS_KEY_ID") ||
            "",
          secretAccessKey:
            this.config.get<string>("S3_SECRET_KEY") ||
            this.config.get<string>("AWS_SECRET_ACCESS_KEY") ||
            ""
        }
      });
    }
  }

  onModuleInit() {
    if (this.driver === "local") {
      mkdirSync(this.uploadRoot, { recursive: true });
      this.logger.log(`Local media storage: ${this.uploadRoot}`);
    } else {
      this.logger.log(
        `S3 media storage enabled (bucket=${this.bucket}, region=${this.region})`
      );
    }
  }

  getDriver(): StorageDriver {
    return this.driver;
  }

  getUploadRoot(): string {
    return this.uploadRoot;
  }

  absolutePath(objectKey: string): string {
    return join(this.uploadRoot, objectKey);
  }

  /** Unauthenticated public-style URL (local only unless bucket is public). */
  publicUrl(objectKey: string): string {
    const key = objectKey.split("\\").join("/");
    if (this.driver === "s3") {
      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
    return `/api/media/files/${key}`;
  }

  /** App-facing URL Image can load — signed GetObject when bucket is private. */
  private readonly readUrlCache = new Map<string, { url: string; expiresAtMs: number }>();

  async getReadUrl(objectKey: string, expiresInSeconds = 43_200): Promise<string> {
    const key = objectKey.split("\\").join("/");
    if (this.driver === "local") {
      return `/api/media/files/${key}`;
    }
    if (!this.client) {
      throw new ServiceUnavailableException("S3 client is not configured");
    }

    const now = Date.now();
    const cached = this.readUrlCache.get(key);
    // Reuse signed URL until ~2 minutes before expiry so clients can cache by stable URL.
    if (cached && cached.expiresAtMs - now > 120_000) {
      return cached.url;
    }

    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds }
    );
    this.readUrlCache.set(key, {
      url,
      expiresAtMs: now + expiresInSeconds * 1000
    });
    return url;
  }

  async saveBuffer(input: {
    userId: string;
    purpose: "profile_photo" | "album_asset";
    contentType: string;
    buffer: Buffer;
  }) {
    const ext = this.extensionFor(input.contentType);
    const objectKey = `${input.purpose}/${input.userId}/${randomUUID()}${ext}`;

    if (this.driver === "local") {
      const fullPath = this.absolutePath(objectKey);
      mkdirSync(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, input.buffer);
      return { objectKey, url: await this.getReadUrl(objectKey) };
    }

    await this.ensureBucket();
    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: input.buffer,
        ContentType: input.contentType
      })
    );
    return { objectKey, url: await this.getReadUrl(objectKey) };
  }

  async createUploadUrl(input: {
    userId: string;
    contentType: string;
    purpose: "profile_photo" | "album_asset";
  }) {
    if (this.driver === "local") {
      const ext = this.extensionFor(input.contentType);
      const objectKey = `${input.purpose}/${input.userId}/${randomUUID()}${ext}`;
      return {
        mode: "local" as const,
        objectKey,
        uploadPath: "/media/upload",
        expiresInSeconds: 900,
        headers: { "Content-Type": "multipart/form-data" }
      };
    }

    await this.ensureBucket();
    const ext = this.extensionFor(input.contentType);
    const objectKey = `${input.purpose}/${input.userId}/${randomUUID()}${ext}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: input.contentType
    });
    const uploadUrl = await getSignedUrl(this.client!, command, { expiresIn: 900 });
    return {
      mode: "s3" as const,
      uploadUrl,
      objectKey,
      bucket: this.bucket,
      expiresInSeconds: 900,
      headers: { "Content-Type": input.contentType }
    };
  }

  async writeStreamToKey(objectKey: string, stream: Readable) {
    if (this.driver !== "local") {
      throw new ServiceUnavailableException("Stream write is only for local storage");
    }
    const fullPath = this.absolutePath(objectKey);
    mkdirSync(dirname(fullPath), { recursive: true });
    await pipeline(stream, createWriteStream(fullPath));
    return { objectKey, url: await this.getReadUrl(objectKey) };
  }

  async deleteObject(objectKey: string) {
    if (this.driver === "local" || !this.client) {
      return;
    }
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: objectKey.split("\\").join("/")
        })
      );
    } catch (error) {
      this.logger.warn(
        `Failed to delete S3 object ${objectKey}: ${(error as Error).message}`
      );
    }
  }

  private extensionFor(contentType: string): string {
    if (contentType.includes("png")) return ".png";
    if (contentType.includes("webp")) return ".webp";
    if (contentType.includes("gif")) return ".gif";
    if (contentType.includes("mp4")) return ".mp4";
    if (contentType.includes("quicktime")) return ".mov";
    return ".jpg";
  }

  private async ensureBucket() {
    if (!this.client) {
      throw new ServiceUnavailableException("S3 client is not configured");
    }
    if (this.bucketReady) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.bucketReady = true;
    } catch (error) {
      this.logger.error(
        `S3 bucket "${this.bucket}" not reachable: ${(error as Error).message}`
      );
      throw new ServiceUnavailableException(
        `S3 bucket "${this.bucket}" is missing or inaccessible. Create it in ${this.region} and check IAM permissions.`
      );
    }
  }

  ensureLocalFileExists(objectKey: string) {
    return existsSync(this.absolutePath(objectKey));
  }
}
