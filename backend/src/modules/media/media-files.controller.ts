import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Query,
  Res
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { createReadStream, existsSync, statSync } from "fs";
import { extname } from "path";
import type { Response } from "express";
import { StorageService } from "../storage/storage.service";

/**
 * Serves local uploads only with a short-lived HMAC query signature.
 * Replaces the previous open static mount that leaked private album files by key.
 */
@ApiTags("media")
@Controller("media")
export class MediaFilesController {
  constructor(private readonly storage: StorageService) {}

  @Get("asset")
  @SkipThrottle()
  serveSignedAsset(
    @Res() res: Response,
    @Query("key") key?: string,
    @Query("expires") expires?: string,
    @Query("sig") sig?: string
  ) {
    return this.streamSigned(res, key, expires, sig);
  }

  /** Path-style signed URLs: /api/media/files/profile_photo/...jpg?expires=&sig= */
  @Get("files/*")
  @SkipThrottle()
  serveSignedPath(
    @Res() res: Response,
    @Query("expires") expires?: string,
    @Query("sig") sig?: string,
    @Query("key") keyFromQuery?: string
  ) {
    // Prefer explicit key query when present; otherwise Nest leaves path in res.req
    const reqPath = (res.req?.path ?? "") as string;
    const marker = "/media/files/";
    const idx = reqPath.indexOf(marker);
    const fromPath =
      idx >= 0
        ? decodeURIComponent(reqPath.slice(idx + marker.length)).replace(/^\/+/, "")
        : "";
    return this.streamSigned(res, keyFromQuery || fromPath, expires, sig);
  }

  private streamSigned(
    res: Response,
    objectKeyRaw: string | undefined,
    expires?: string,
    sig?: string
  ) {
    if (this.storage.getDriver() !== "local") {
      throw new NotFoundException("Local media files are not available");
    }

    const objectKey = (objectKeyRaw ?? "")
      .split("\\")
      .join("/")
      .replace(/^\/+/, "");

    if (!objectKey || objectKey.includes("..")) {
      throw new ForbiddenException("Invalid media path");
    }

    this.storage.assertValidSignedRead(objectKey, expires, sig);

    const absolute = this.storage.absolutePath(objectKey);
    if (!existsSync(absolute)) {
      throw new NotFoundException("File not found");
    }

    const stats = statSync(absolute);
    res.setHeader("Content-Length", String(stats.size));
    res.setHeader("Content-Type", this.contentTypeFor(objectKey));
    res.setHeader("Cache-Control", "private, max-age=300");
    createReadStream(absolute).pipe(res);
  }

  private contentTypeFor(objectKey: string): string {
    switch (extname(objectKey).toLowerCase()) {
      case ".png":
        return "image/png";
      case ".webp":
        return "image/webp";
      case ".gif":
        return "image/gif";
      case ".mp4":
        return "video/mp4";
      case ".mov":
        return "video/quicktime";
      case ".jpg":
      case ".jpeg":
      default:
        return "image/jpeg";
    }
  }
}
