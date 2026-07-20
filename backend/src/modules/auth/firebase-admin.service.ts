import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { App, cert, getApps, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { existsSync, readFileSync } from "fs";
import { isAbsolute, resolve } from "path";

export type VerifiedFirebasePhone = {
  uid: string;
  phoneNumber: string;
};

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (getApps().length) {
      this.app = getApps()[0]!;
      return;
    }

    const pathEnv = this.configService.get<string>("FIREBASE_SERVICE_ACCOUNT_PATH");
    const jsonEnv = this.configService.get<string>("FIREBASE_SERVICE_ACCOUNT_JSON");
    const gacEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    try {
      if (jsonEnv?.trim()) {
        const parsed = JSON.parse(jsonEnv) as ServiceAccount;
        this.app = initializeApp({ credential: cert(parsed) });
        this.logger.log("Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON");
        return;
      }

      const candidates = this.resolveCredentialPaths(pathEnv, gacEnv);
      for (const absolute of candidates) {
        if (!existsSync(absolute)) {
          continue;
        }
        const parsed = JSON.parse(readFileSync(absolute, "utf8")) as ServiceAccount;
        this.app = initializeApp({ credential: cert(parsed) });
        this.logger.log(`Firebase Admin initialized from ${absolute}`);
        return;
      }

      this.logger.warn(
        "Firebase Admin not configured. Download the service account JSON from Firebase Console → Project settings → Service accounts → Generate new private key, save as backend/firebase-service-account.json, then restart the backend."
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase Admin: ${(error as Error).message}`
      );
    }
  }

  private resolveCredentialPaths(
    pathEnv?: string,
    gacEnv?: string
  ): string[] {
    const defaults = [
      "firebase-service-account.json",
      "./firebase-service-account.json",
      "backend/firebase-service-account.json"
    ];
    const raw = [pathEnv, gacEnv, ...defaults].filter(
      (value): value is string => Boolean(value?.trim())
    );

    const cwd = process.cwd();
    const unique = new Set<string>();
    for (const entry of raw) {
      const absolute = isAbsolute(entry) ? entry : resolve(cwd, entry);
      unique.add(absolute);
    }
    return Array.from(unique);
  }

  isConfigured(): boolean {
    return this.app !== null;
  }

  async verifyPhoneIdToken(idToken: string): Promise<VerifiedFirebasePhone> {
    if (!this.app) {
      throw new ServiceUnavailableException(
        "Firebase Admin is not configured. Add backend/firebase-service-account.json and set FIREBASE_SERVICE_ACCOUNT_PATH."
      );
    }

    try {
      const decoded = await getAuth(this.app).verifyIdToken(idToken.trim());
      const phoneNumber = decoded.phone_number;
      if (!phoneNumber) {
        throw new UnauthorizedException(
          "Firebase token has no phone number. Complete phone OTP first."
        );
      }
      return { uid: decoded.uid, phoneNumber };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new UnauthorizedException(
        `Invalid Firebase ID token: ${(error as Error).message}`
      );
    }
  }
}
