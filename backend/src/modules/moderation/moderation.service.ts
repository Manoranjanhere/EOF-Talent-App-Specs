import { Injectable, NotFoundException } from "@nestjs/common";
import { FlagStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { FlagUserDto } from "./dto/flag-user.dto";
import { AdminActionDto } from "./dto/admin-action.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  flagUser(raisedByUserId: string, dto: FlagUserDto, audit: AuditData) {
    return this.prisma.profileFlagReport.create({
      data: {
        reportedUserId: dto.reportedUserId,
        raisedByUserId,
        reason: dto.reason,
        details: dto.details,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      include: {
        reportedUser: true,
        raisedBy: true
      }
    });
  }

  listReports(status?: FlagStatus) {
    return this.prisma.profileFlagReport.findMany({
      where: status ? { status, isActive: true } : { isActive: true },
      include: {
        reportedUser: true,
        raisedBy: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async takeAction(adminUserId: string, dto: AdminActionDto, audit: AuditData) {
    const report = await this.prisma.profileFlagReport.findUnique({
      where: { id: dto.reportId }
    });
    if (!report) {
      throw new NotFoundException("Report not found");
    }

    const action = await this.prisma.adminActionLog.create({
      data: {
        reportId: dto.reportId,
        actedOnUserId: report.reportedUserId,
        actedByUserId: adminUserId,
        actionType: dto.actionType,
        notes: dto.notes,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.prisma.profileFlagReport.update({
      where: { id: dto.reportId },
      data: {
        status: dto.reportStatus,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    if (dto.actionType === "DEACTIVATE" || dto.actionType === "BAN" || dto.actionType === "SUSPEND") {
      const existing = await this.prisma.userAccount.findUnique({
        where: { id: report.reportedUserId }
      });
      if (existing) {
        await this.prisma.userAccount.update({
          where: { id: report.reportedUserId },
          data: {
            isActive: false,
            loginEnabled: false,
            lastUpdateIp: audit.ip,
            lastUpdateBy: audit.updatedBy
          }
        });
        await this.prisma.userStatusHistory.create({
          data: {
            userId: report.reportedUserId,
            oldIsActive: existing.isActive,
            newIsActive: false,
            reason: `moderation_${dto.actionType.toLowerCase()}`,
            lastUpdateIp: audit.ip,
            lastUpdateBy: audit.updatedBy
          }
        });
      }
    }

    await this.prisma.cloneAuditAdmin.create({
      data: {
        sourceTable: "admin_action_log",
        sourceId: action.id,
        actionType: dto.actionType,
        payloadJson: {
          ...action,
          reportId: report.id,
          reportedUserId: report.reportedUserId,
          notes: dto.notes
        },
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return action;
  }
}
