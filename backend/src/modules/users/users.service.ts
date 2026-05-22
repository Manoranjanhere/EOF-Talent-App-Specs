import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: { roles: true, profileTalent: true, profileOrg: true }
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async setUserActive(userId: string, isActive: boolean, audit: AuditData) {
    const existing = await this.prisma.userAccount.findUnique({
      where: { id: userId }
    });
    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const updated = await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        isActive,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
    await this.prisma.userStatusHistory.create({
      data: {
        userId,
        oldIsActive: existing.isActive,
        newIsActive: isActive,
        reason: "admin_update",
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return updated;
  }

  async setLoginEnabled(userId: string, loginEnabled: boolean, audit: AuditData) {
    return this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        loginEnabled,
        loginResetDate: new Date(),
        loginAttempts: 0,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }
}
