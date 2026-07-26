import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createSign } from "crypto";
import { readFileSync } from "fs";

type PlayVerifyInput = {
  productId: string;
  purchaseToken: string;
  packageName?: string;
  /** one-time product vs auto-renewing subscription */
  kind: "product" | "subscription";
};

/**
 * Verifies Google Play Billing purchase tokens via Android Publisher API.
 * Set GOOGLE_PLAY_PACKAGE_NAME + GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (path or raw JSON).
 * For local/staging without Play Console: PLAY_BILLING_BYPASS=true accepts tokens
 * starting with `dev-bypass:`.
 */
@Injectable()
export class PlayBillingService {
  private readonly logger = new Logger(PlayBillingService.name);

  constructor(private readonly config: ConfigService) {}

  playProductIdForPlanCode(planCode: string): string | null {
    const envKey = `PLAY_SKU_${planCode}`;
    const mapped = this.config.get<string>(envKey)?.trim();
    if (mapped) return mapped;
    // Sensible defaults so mobile + backend stay aligned before Console SKUs exist.
    const defaults: Record<string, string> = {
      MSG_MEMBER_100: "eof_msg_member_100",
      MSG_EMPLOYER_300: "eof_msg_employer_300",
      JOB_POST_300_90: "eof_job_post_300"
    };
    return defaults[planCode] ?? null;
  }

  private bypassEnabled(): boolean {
    const flag = this.config.get<string>("PLAY_BILLING_BYPASS");
    return Boolean(flag && ["true", "1", "yes"].includes(flag.toLowerCase()));
  }

  async verifyPaidPurchase(input: PlayVerifyInput): Promise<{ orderId: string }> {
    const token = input.purchaseToken?.trim();
    const productId = input.productId?.trim();
    if (!token || !productId) {
      throw new BadRequestException(
        "Google Play purchaseToken and productId are required for paid subscriptions."
      );
    }

    if (this.bypassEnabled() && token.startsWith("dev-bypass:")) {
      this.logger.warn(`Play billing bypass accepted for product ${productId}`);
      return { orderId: token };
    }

    const packageName =
      input.packageName?.trim() ||
      this.config.get<string>("GOOGLE_PLAY_PACKAGE_NAME")?.trim() ||
      "";
    if (!packageName) {
      throw new ServiceUnavailableException(
        "GOOGLE_PLAY_PACKAGE_NAME is not configured on the server."
      );
    }

    const accessToken = await this.getAccessToken();
    const encodedToken = encodeURIComponent(token);
    const path =
      input.kind === "subscription"
        ? `applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodedToken}`
        : `applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodedToken}`;

    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/${path}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    const bodyText = await response.text();
    if (!response.ok) {
      this.logger.warn(`Play verify failed (${response.status}): ${bodyText}`);
      throw new BadRequestException(
        "Google Play could not verify this purchase. Complete payment in Play Store and try again."
      );
    }

    let parsed: {
      orderId?: string;
      purchaseState?: number;
      paymentState?: number;
      expiryTimeMillis?: string;
    } = {};
    try {
      parsed = JSON.parse(bodyText) as typeof parsed;
    } catch {
      throw new BadRequestException("Invalid response from Google Play");
    }

    if (input.kind === "product" && parsed.purchaseState !== 0) {
      throw new BadRequestException("Play product purchase is not completed");
    }
    if (input.kind === "subscription") {
      // paymentState 1 = received; 0 may be pending on some accounts
      if (parsed.paymentState !== undefined && parsed.paymentState === 0) {
        throw new BadRequestException("Play subscription payment is still pending");
      }
      if (parsed.expiryTimeMillis && Number(parsed.expiryTimeMillis) < Date.now()) {
        throw new BadRequestException("Play subscription already expired");
      }
    }

    return { orderId: parsed.orderId || token };
  }

  private loadServiceAccount(): { client_email: string; private_key: string } {
    const raw =
      this.config.get<string>("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")?.trim() ||
      this.config.get<string>("GOOGLE_APPLICATION_CREDENTIALS")?.trim() ||
      "";
    if (!raw) {
      throw new ServiceUnavailableException(
        "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured for Play purchase verification."
      );
    }
    try {
      if (raw.startsWith("{")) {
        return JSON.parse(raw) as { client_email: string; private_key: string };
      }
      const fromFile = readFileSync(raw, "utf8");
      return JSON.parse(fromFile) as { client_email: string; private_key: string };
    } catch (error) {
      this.logger.error(`Failed to load Play service account: ${(error as Error).message}`);
      throw new ServiceUnavailableException("Invalid Google Play service account configuration");
    }
  }

  private async getAccessToken(): Promise<string> {
    const sa = this.loadServiceAccount();
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString(
      "base64url"
    );
    const claim = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/androidpublisher",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600
      })
    ).toString("base64url");
    const unsigned = `${header}.${claim}`;
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    signer.end();
    const signature = signer.sign(sa.private_key, "base64url");
    const assertion = `${unsigned}.${signature}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion
      })
    });
    const tokenBody = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenRes.ok || !tokenBody.access_token) {
      throw new ServiceUnavailableException(
        `Google OAuth failed for Play Billing: ${tokenBody.error || tokenRes.status}`
      );
    }
    return tokenBody.access_token;
  }
}
