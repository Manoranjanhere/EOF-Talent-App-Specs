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
import { MobileOtpLoginDto } from "./dto/mobile-otp-login.dto";
import { SendMobileOtpDto } from "./dto/send-mobile-otp.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly otpStore = new Map<
    string,
    { code: string; expiresAt: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto, audit: AuditData) {
    const email = dto.email?.trim().toLowerCase() || undefined;
    const mobileNumber = dto.mobileNumber?.trim() || undefined;

    if (!email && !mobileNumber) {
      throw new BadRequestException("Email or mobile number is required");
    }

    if (email) {
      const existingEmail = await this.prisma.userAccount.findUnique({
        where: { email }
      });
      if (existingEmail) {
        throw new ConflictException(
          "An account with this email already exists. Please sign in instead."
        );
      }
    }

    if (mobileNumber) {
      const existingMobile = await this.prisma.userAccount.findUnique({
        where: { mobileNumber }
      });
      if (existingMobile) {
        throw new ConflictException(
          "An account with this mobile number already exists. Please sign in instead."
        );
      }
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
          profileTalent:
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

  async login(dto: LoginDto, audit: AuditData) {
    const email = dto.email?.trim().toLowerCase();
    const mobileNumber = dto.mobileNumber?.trim();

    const user = await this.prisma.userAccount.findFirst({
      where: email ? { email } : { mobileNumber },
      include: { roles: true }
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
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
      throw new UnauthorizedException("Invalid credentials");
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

  async loginWithMobileOtp(dto: MobileOtpLoginDto, audit: AuditData) {
    const mobileNumber = this.normalizeMobile(dto.mobileNumber);
    if (!mobileNumber) {
      throw new BadRequestException("Mobile number is required");
    }

    const user = await this.prisma.userAccount.findUnique({
      where: { mobileNumber },
      include: { roles: true }
    });
    if (!user) {
      throw new NotFoundException(
        "No account found with this mobile number. Register with this mobile first."
      );
    }
    this.assertLoginAllowed(user);

    const otpRecord = this.otpStore.get(mobileNumber);
    if (!otpRecord) {
      throw new UnauthorizedException("OTP not requested. Please send OTP first.");
    }
    if (Date.now() > otpRecord.expiresAt) {
      this.otpStore.delete(mobileNumber);
      throw new UnauthorizedException("OTP expired. Please request a new OTP.");
    }
    if (otpRecord.code !== dto.otpCode.trim()) {
      throw new UnauthorizedException("Invalid OTP");
    }

    this.otpStore.delete(mobileNumber);

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

  async sendMobileOtp(dto: SendMobileOtpDto) {
    const mobileNumber = this.normalizeMobile(dto.mobileNumber);
    if (!mobileNumber) {
      throw new BadRequestException("Mobile number is required");
    }

    const user = await this.prisma.userAccount.findUnique({
      where: { mobileNumber }
    });
    if (!user) {
      throw new NotFoundException(
        "No account found with this mobile number. Register with this mobile first, or sign in with email."
      );
    }
    this.assertLoginAllowed(user);

    const devMode = this.isOtpDevMode();
    const otpCode = devMode
      ? "123456"
      : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this.otpStore.set(mobileNumber, { code: otpCode, expiresAt });

    if (devMode) {
      this.logger.log(
        `[DEV OTP] mobile=${mobileNumber} code=${otpCode} (valid 5 min; no SMS in MVP)`
      );
    } else {
      this.logger.warn(
        `OTP generated for ${mobileNumber} but SMS provider is not configured yet`
      );
    }

    return {
      success: true,
      message: devMode
        ? "OTP generated (dev mode). Check backend terminal or app hint."
        : "OTP sent successfully",
      expiresInSeconds: 300,
      ...(devMode ? { otpCode } : {})
    };
  }

  private normalizeMobile(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private isOtpDevMode(): boolean {
    const flag = this.configService.get<string>("OTP_TEST_BYPASS");
    if (flag !== undefined && flag !== "") {
      return ["true", "1", "yes"].includes(flag.toLowerCase());
    }
    return this.configService.get<string>("NODE_ENV") !== "production";
  }

  private assertLoginAllowed(user: UserAccount) {
    if (!user.loginEnabled || !user.isActive) {
      throw new UnauthorizedException("Login disabled");
    }
    if (user.loginAttempts >= 3) {
      throw new UnauthorizedException("Account locked due to failed attempts");
    }
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
