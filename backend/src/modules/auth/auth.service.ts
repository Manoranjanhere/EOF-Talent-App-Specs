import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserAccount } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../database/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { MobileOtpLoginDto } from "./dto/mobile-otp-login.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto, audit: AuditData) {
    if (!dto.email && !dto.mobileNumber) {
      throw new BadRequestException("Email or mobile number is required");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.userAccount.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        mobileNumber: dto.mobileNumber,
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
        profileTalent: dto.groupId === 1 ? {
          create: {
            lastUpdateIp: audit.ip,
            lastUpdateBy: audit.updatedBy
          }
        } : undefined
      },
      include: { roles: true }
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto, audit: AuditData) {
    const user = await this.prisma.userAccount.findFirst({
      where: dto.email
        ? { email: dto.email }
        : { mobileNumber: dto.mobileNumber },
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
    const otpBypass = this.configService.get("OTP_TEST_BYPASS") === "true";
    if (!otpBypass && dto.otpCode !== "123456") {
      throw new UnauthorizedException("Invalid OTP");
    }

    const user = await this.prisma.userAccount.findUnique({
      where: { mobileNumber: dto.mobileNumber },
      include: { roles: true }
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    this.assertLoginAllowed(user);

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
