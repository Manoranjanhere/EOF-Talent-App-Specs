import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserAccount } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../database/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SendMobileOtpDto } from "./dto/send-mobile-otp.dto";
import { FirebaseAdminService } from "./firebase-admin.service";
import { normalizeMobileE164, phonesMatch } from "./phone.util";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly otpStore = new Map<
    string,
    { code: string; expiresAt: number; purpose: "register" | "reset" }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  async register(dto: RegisterDto, audit: AuditData) {
    const email = dto.email.trim().toLowerCase();
    const mobileNumber = this.requireMobile(dto.mobileNumber);

    await this.assertPhoneVerified({
      mobileNumber,
      firebaseIdToken: dto.firebaseIdToken,
      otpCode: dto.otpCode,
      purpose: "register"
    });

    const existingEmail = await this.prisma.userAccount.findUnique({
      where: { email }
    });
    if (existingEmail) {
      throw new ConflictException(
        "An account with this email already exists. Please sign in instead."
      );
    }

    const existingMobile = await this.findUserByMobile(mobileNumber);
    if (existingMobile) {
      throw new ConflictException(
        "An account with this mobile number already exists. Please sign in instead."
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.userAccount.create({
        data: {
          fullName: dto.fullName.trim(),
          email,
          mobileNumber,
          passwordHash,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy,
          roles: {
            create: {
              groupId: dto.groupId,
              isPrimary: true,
              lastUpdateIp: audit.ip,
              lastUpdateBy: audit.updatedBy
            }
          },
          profileMember:
            dto.groupId === 1
              ? {
                  create: {
                    lastUpdateIp: audit.ip,
                    lastUpdateBy: audit.updatedBy
                  }
                }
              : undefined
        },
        include: { roles: true }
      });

      return this.issueTokens(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[] | undefined) ?? [];
        if (target.includes("email")) {
          throw new ConflictException(
            "An account with this email already exists. Please sign in instead."
          );
        }
        if (target.includes("mobile_number")) {
          throw new ConflictException(
            "An account with this mobile number already exists. Please sign in instead."
          );
        }
        throw new ConflictException("Account already exists. Please sign in instead.");
      }
      throw error;
    }
  }

  /** Login with email+password OR phone+password (no OTP). */
  async login(dto: LoginDto, audit: AuditData) {
    const email = dto.email?.trim().toLowerCase();
    const mobileNumber = dto.mobileNumber
      ? this.requireMobile(dto.mobileNumber)
      : undefined;

    if (!email && !mobileNumber) {
      throw new BadRequestException("Email or mobile number is required");
    }
    if (email && mobileNumber) {
      throw new BadRequestException("Use either email or mobile number, not both");
    }

    const user = email
      ? await this.prisma.userAccount.findUnique({
          where: { email },
          include: { roles: true }
        })
      : await this.findUserByMobile(mobileNumber!, true);

    if (!user) {
      throw new NotFoundException(
        email
          ? "No account exists with this email."
          : "No account exists with this phone number."
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        "This account has no password set. Please contact support."
      );
    }

    this.assertLoginAllowed(user);

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      await this.prisma.userAccount.update({
        where: { id: user.id },
        data: {
          loginAttempts: user.loginAttempts + 1,
          lastFailedLogin: new Date(),
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        }
      });
      throw new UnauthorizedException("Incorrect password.");
    }

    if (mobileNumber && user.mobileNumber !== mobileNumber) {
      await this.prisma.userAccount.update({
        where: { id: user.id },
        data: { mobileNumber }
      });
      user.mobileNumber = mobileNumber;
    }

    await this.prisma.userAccount.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        loginResetDate: new Date(),
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return this.issueTokens(user);
  }

  /** Dev bypass only — real SMS is sent by Firebase on the device. */
  async sendRegistrationOtp(dto: SendMobileOtpDto) {
    if (!this.isOtpDevMode()) {
      throw new BadRequestException(
        "Backend OTP is disabled. Use Firebase Phone Auth on the mobile app for real SMS."
      );
    }

    const mobileNumber = this.requireMobile(dto.mobileNumber);
    const existing = await this.findUserByMobile(mobileNumber);
    if (existing) {
      throw new ConflictException(
        "An account with this mobile number already exists. Please sign in instead."
      );
    }

    const otpCode = "123456";
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(mobileNumber, { code: otpCode, expiresAt, purpose: "register" });
    this.logger.log(`[DEV OTP] mobile=${mobileNumber} code=${otpCode}`);

    return {
      success: true,
      message: "OTP generated (dev mode).",
      expiresInSeconds: 300,
      otpCode
    };
  }

  /**
   * Confirms an account exists for reset. In OTP_TEST_BYPASS mode returns a
   * fixed OTP; otherwise the mobile app must send real SMS via Firebase.
   */
  async sendPasswordResetOtp(dto: SendMobileOtpDto) {
    const mobileNumber = this.requireMobile(dto.mobileNumber);
    const user = await this.findUserByMobile(mobileNumber);
    if (!user) {
      throw new NotFoundException("No account exists with this phone number.");
    }
    this.assertLoginAllowed(user);

    if (!this.isOtpDevMode()) {
      return {
        success: true,
        message: "Account found. Complete Firebase phone OTP on the device.",
        expiresInSeconds: 300
      };
    }

    const otpCode = "123456";
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(mobileNumber, { code: otpCode, expiresAt, purpose: "reset" });
    this.logger.log(`[DEV RESET OTP] mobile=${mobileNumber} code=${otpCode}`);

    return {
      success: true,
      message: "OTP generated (dev mode).",
      expiresInSeconds: 300,
      otpCode
    };
  }

  async resetPassword(
    dto: {
      mobileNumber: string;
      firebaseIdToken?: string;
      otpCode?: string;
      newPassword: string;
    },
    audit: AuditData
  ) {
    const mobileNumber = this.requireMobile(dto.mobileNumber);

    await this.assertPhoneVerified({
      mobileNumber,
      firebaseIdToken: dto.firebaseIdToken,
      otpCode: dto.otpCode,
      purpose: "reset"
    });

    const user = await this.findUserByMobile(mobileNumber, true);
    if (!user) {
      throw new NotFoundException("No account exists with this phone number.");
    }
    this.assertLoginAllowed(user);

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.userAccount.update({
      where: { id: user.id },
      data: {
        passwordHash,
        loginAttempts: 0,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy,
        ...(user.mobileNumber !== mobileNumber ? { mobileNumber } : {})
      }
    });

    if (user.mobileNumber !== mobileNumber) {
      user.mobileNumber = mobileNumber;
    }

    return this.issueTokens(user);
  }

  private async findUserByMobile(mobileNumber: string): Promise<UserAccount | null>;
  private async findUserByMobile(
    mobileNumber: string,
    withRoles: true
  ): Promise<(UserAccount & { roles: { groupId: number }[] }) | null>;
  private async findUserByMobile(mobileNumber: string, withRoles = false) {
    const digits = mobileNumber.replace(/\D/g, "");
    const local10 = digits.slice(-10);
    const candidates = Array.from(
      new Set([mobileNumber, digits, local10, `+${digits}`].filter(Boolean))
    );

    if (withRoles) {
      return this.prisma.userAccount.findFirst({
        where: { mobileNumber: { in: candidates } },
        include: { roles: true }
      });
    }

    return this.prisma.userAccount.findFirst({
      where: { mobileNumber: { in: candidates } }
    });
  }

  private async assertPhoneVerified(input: {
    mobileNumber: string;
    firebaseIdToken?: string;
    otpCode?: string;
    purpose: "register" | "reset";
  }) {
    if (input.firebaseIdToken?.trim()) {
      const verified = await this.firebaseAdmin.verifyPhoneIdToken(
        input.firebaseIdToken
      );
      if (!phonesMatch(verified.phoneNumber, input.mobileNumber)) {
        throw new UnauthorizedException(
          "Firebase-verified phone does not match the submitted mobile number."
        );
      }
      return;
    }

    if (input.otpCode?.trim() && this.isOtpDevMode()) {
      this.verifyDevOtp(input.mobileNumber, input.otpCode, input.purpose);
      return;
    }

    throw new BadRequestException(
      "Phone verification required. Complete Firebase SMS OTP and send firebaseIdToken."
    );
  }

  private verifyDevOtp(
    mobileNumber: string,
    otpCode: string,
    purpose: "register" | "reset"
  ) {
    const otpRecord = this.otpStore.get(mobileNumber);
    if (!otpRecord || otpRecord.purpose !== purpose) {
      throw new UnauthorizedException("OTP not requested. Please send OTP first.");
    }
    if (Date.now() > otpRecord.expiresAt) {
      this.otpStore.delete(mobileNumber);
      throw new UnauthorizedException("OTP expired. Please request a new OTP.");
    }
    if (otpRecord.code !== otpCode.trim()) {
      throw new UnauthorizedException("Invalid OTP");
    }
    this.otpStore.delete(mobileNumber);
  }

  private requireMobile(value?: string): string {
    const mobileNumber = normalizeMobileE164(value);
    if (!mobileNumber) {
      throw new BadRequestException("Mobile number is required");
    }
    return mobileNumber;
  }

  private isOtpDevMode(): boolean {
    const flag = this.configService.get<string>("OTP_TEST_BYPASS");
    return flag !== undefined && ["true", "1", "yes"].includes(flag.toLowerCase());
  }

  private assertLoginAllowed(user: UserAccount) {
    if (!user.isActive) {
      throw new UnauthorizedException(
        "Your account has been blocked by an administrator. You cannot sign in. Contact support if you think this is a mistake."
      );
    }
    if (!user.loginEnabled) {
      throw new UnauthorizedException(
        "Login has been disabled for this account by an administrator. Contact support for help."
      );
    }
    if (user.loginAttempts >= 3) {
      throw new UnauthorizedException(
        "Account locked due to too many failed login attempts. Reset your password or contact support."
      );
    }
  }

  async refresh(refreshToken: string) {
    let payload: { sub?: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET")
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    if (!payload?.sub) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.userAccount.findUnique({
      where: { id: payload.sub },
      include: { roles: true }
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    this.assertLoginAllowed(user);
    return this.issueTokens(user);
  }

  private issueTokens(user: UserAccount & { roles: { groupId: number }[] }) {
    const roles = user.roles.map((role) => role.groupId);
    const payload = { sub: user.id, roles };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES") ?? "15m"
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES") ?? "30d"
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        roles
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }
}
