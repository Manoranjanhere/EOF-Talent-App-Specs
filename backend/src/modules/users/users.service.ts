import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type AuditData = {
  ip: string;
  updatedBy: string;
};

export type ListUsersQuery = {
  q?: string;
  status?: "all" | "active" | "banned";
  loginEnabled?: "all" | "yes" | "no";
  page?: number;
  pageSize?: number;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: { roles: true, profileMember: true, profileOrg: true }
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async listUsers(query: ListUsersQuery) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 50, 200);
    const where: Prisma.UserAccountWhereInput = {};

    // Admin listing shows everyone by default (including banned / inactive).
    if (query.status === "active") {
      where.isActive = true;
    } else if (query.status === "banned") {
      where.isActive = false;
    }

    if (query.loginEnabled === "yes") {
      where.loginEnabled = true;
    } else if (query.loginEnabled === "no") {
      where.loginEnabled = false;
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { mobileNumber: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.userAccount.findMany({
        where,
        include: {
          roles: {
            where: { isActive: true },
            include: { group: true }
          }
        },
        orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.userAccount.count({ where })
    ]);

    return {
      page,
      pageSize,
      total,
      items: items.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        city: user.city,
        country: user.country,
        isActive: user.isActive,
        loginEnabled: user.loginEnabled,
        loginAttempts: user.loginAttempts,
        roles: user.roles.map((role) => ({
          groupId: role.groupId,
          title: role.group.title
        })),
        createdAt: user.createdAt,
        lastUpdateAt: user.lastUpdateAt
      }))
    };
  }

  async setUserActive(userId: string, isActive: boolean, audit: AuditData, reason = "admin_update") {
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
        loginEnabled: isActive ? existing.loginEnabled : false,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.prisma.userStatusHistory.create({
      data: {
        userId,
        oldIsActive: existing.isActive,
        newIsActive: isActive,
        reason,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.prisma.cloneAuditAdmin.create({
      data: {
        sourceTable: "user_account",
        sourceId: userId,
        actionType: isActive ? "ACTIVATE" : "BAN",
        payloadJson: {
          before: {
            isActive: existing.isActive,
            loginEnabled: existing.loginEnabled
          },
          after: {
            isActive: updated.isActive,
            loginEnabled: updated.loginEnabled
          },
          reason
        },
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return updated;
  }

  async banUser(userId: string, audit: AuditData, notes?: string) {
    return this.setUserActive(userId, false, audit, notes?.trim() || "admin_ban");
  }

  async unbanUser(userId: string, audit: AuditData, notes?: string) {
    const existing = await this.prisma.userAccount.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const updated = await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        isActive: true,
        loginEnabled: true,
        loginAttempts: 0,
        loginResetDate: new Date(),
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.prisma.userStatusHistory.create({
      data: {
        userId,
        oldIsActive: existing.isActive,
        newIsActive: true,
        reason: notes?.trim() || "admin_unban",
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.prisma.cloneAuditAdmin.create({
      data: {
        sourceTable: "user_account",
        sourceId: userId,
        actionType: "UNBAN",
        payloadJson: {
          before: {
            isActive: existing.isActive,
            loginEnabled: existing.loginEnabled
          },
          after: {
            isActive: updated.isActive,
            loginEnabled: updated.loginEnabled
          },
          reason: notes?.trim() || "admin_unban"
        },
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return updated;
  }

  async setLoginEnabled(userId: string, loginEnabled: boolean, audit: AuditData) {
    const existing = await this.prisma.userAccount.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const updated = await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        loginEnabled,
        loginResetDate: new Date(),
        loginAttempts: loginEnabled ? 0 : existing.loginAttempts,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.prisma.cloneAuditAdmin.create({
      data: {
        sourceTable: "user_account",
        sourceId: userId,
        actionType: loginEnabled ? "LOGIN_ENABLE" : "LOGIN_DISABLE",
        payloadJson: {
          before: { loginEnabled: existing.loginEnabled },
          after: { loginEnabled: updated.loginEnabled }
        },
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return updated;
  }
}
