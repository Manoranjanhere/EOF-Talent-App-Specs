import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ChatService } from "../chat/chat.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

/** Must match group_master.id / code for Super Admin — never Admin (5) or Team Admin (7). */
const SUPER_ADMIN_GROUP_ID = 10;
const SUPER_ADMIN_CODE = "SUPER_ADMIN";

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService
  ) {}

  async create(userId: string, dto: CreateFeedbackDto, audit: AuditData) {
    const feedback = await this.prisma.helpFeedback.create({
      data: {
        userId,
        subject: dto.subject,
        message: dto.message,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    const notified = await this.notifySuperAdminsOnly(
      userId,
      dto.subject,
      dto.message,
      audit
    );

    return {
      ...feedback,
      notifiedSuperAdminCount: notified.count,
      notifiedSuperAdmins: notified.recipients
    };
  }

  /**
   * Chat delivery is Super Admin ONLY (group_id = 10 / SUPER_ADMIN).
   * Admin (5) and Team Admin (7) are never selected.
   */
  private async notifySuperAdminsOnly(
    fromUserId: string,
    subject: string,
    body: string,
    audit: AuditData
  ) {
    const links = await this.prisma.userRoleLink.findMany({
      where: {
        isActive: true,
        groupId: SUPER_ADMIN_GROUP_ID,
        group: {
          id: SUPER_ADMIN_GROUP_ID,
          code: SUPER_ADMIN_CODE
        },
        user: {
          isActive: true,
          loginEnabled: true
        }
      },
      select: {
        userId: true,
        groupId: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            roles: {
              where: { isActive: true },
              select: { groupId: true }
            }
          }
        },
        group: { select: { id: true, code: true } }
      }
    });

    // Belt-and-suspenders: drop any row that is not literally Super Admin.
    const recipients = links
      .filter(
        (link) =>
          link.groupId === SUPER_ADMIN_GROUP_ID &&
          link.group?.code === SUPER_ADMIN_CODE &&
          link.userId !== fromUserId &&
          link.user?.id
      )
      .map((link) => ({
        userId: link.userId,
        email: link.user.email,
        fullName: link.user.fullName,
        alsoHasAdminRole: link.user.roles.some((r) => r.groupId === 5 || r.groupId === 7)
      }));

    const uniqueById = new Map(recipients.map((r) => [r.userId, r]));
    const uniqueRecipients = [...uniqueById.values()];

    this.logger.log(
      `Feedback notify: ${uniqueRecipients.length} Super Admin recipient(s): ${uniqueRecipients
        .map((r) => `${r.email ?? r.userId}${r.alsoHasAdminRole ? " (also has Admin/TeamAdmin role)" : ""}`)
        .join(", ") || "(none)"}`
    );

    if (uniqueRecipients.length === 0) {
      this.logger.warn(
        "Feedback saved but no Super Admin (group_id=10) found to notify via chat."
      );
      return { count: 0, recipients: [] as Array<{ userId: string; email: string | null; fullName: string }> };
    }

    await this.chatService.deliverFeedbackMessages(
      fromUserId,
      uniqueRecipients.map((r) => r.userId),
      subject,
      body,
      audit
    );

    return {
      count: uniqueRecipients.length,
      recipients: uniqueRecipients.map((r) => ({
        userId: r.userId,
        email: r.email,
        fullName: r.fullName
      }))
    };
  }

  listForUser(userId: string) {
    return this.prisma.helpFeedback.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" }
    });
  }
}
