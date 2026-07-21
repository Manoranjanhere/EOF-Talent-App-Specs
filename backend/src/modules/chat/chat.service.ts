import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { GroupId } from "@eof/shared";
import { PrismaService } from "../../database/prisma.service";
import { CreateThreadDto } from "./dto/create-thread.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { BlockUserDto } from "./dto/block-user.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

const MESSAGING_PLAN_CODES = ["MSG_MEMBER_100", "MSG_EMPLOYER_300"];

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async isAdminUser(userId: string) {
    const adminRole = await this.prisma.userRoleLink.findFirst({
      where: {
        userId,
        isActive: true,
        groupId: { in: [GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin] }
      }
    });
    return Boolean(adminRole);
  }

  private async isTalentUser(userId: string) {
    const talentRole = await this.prisma.userRoleLink.findFirst({
      where: {
        userId,
        groupId: GroupId.Talent,
        isActive: true
      }
    });
    return Boolean(talentRole);
  }

  async assertMessagingSubscription(userId: string) {
    if (await this.isAdminUser(userId)) {
      return;
    }
    if (await this.isTalentUser(userId)) {
      return;
    }
    const active = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        isActive: true,
        lastExpiry: { gte: new Date() },
        plan: {
          isJobPostingPlan: false,
          published: true,
          isActive: true,
          code: { in: MESSAGING_PLAN_CODES }
        }
      }
    });
    if (!active) {
      throw new ForbiddenException(
        "Active messaging subscription required (₹300/month for employers and agencies)"
      );
    }
  }

  async messagingStatus(userId: string) {
    if (await this.isAdminUser(userId)) {
      return { active: true, isAdmin: true, planCode: null, expiresAt: null, isTalentFree: false };
    }
    if (await this.isTalentUser(userId)) {
      return { active: true, isAdmin: false, planCode: null, expiresAt: null, isTalentFree: true };
    }
    const sub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        isActive: true,
        lastExpiry: { gte: new Date() },
        plan: {
          isJobPostingPlan: false,
          published: true,
          isActive: true,
          code: { in: MESSAGING_PLAN_CODES }
        }
      },
      include: { plan: true },
      orderBy: { lastExpiry: "desc" }
    });
    return {
      active: Boolean(sub),
      isAdmin: false,
      planCode: sub?.plan.code ?? null,
      expiresAt: sub?.lastExpiry ?? null,
      isTalentFree: false
    };
  }

  async findOrCreateDirectThread(userId: string, recipientUserId: string, audit: AuditData) {
    if (userId === recipientUserId) {
      throw new BadRequestException("Cannot message yourself");
    }
    await this.assertMessagingSubscription(userId);

    const recipient = await this.prisma.userAccount.findUnique({
      where: { id: recipientUserId }
    });
    if (!recipient || !recipient.isActive) {
      throw new NotFoundException("Recipient not found");
    }

    const blocked = await this.prisma.chatBlockList.findFirst({
      where: {
        isActive: true,
        OR: [
          { blockedByUserId: userId, blockedUserId: recipientUserId },
          { blockedByUserId: recipientUserId, blockedUserId: userId }
        ]
      }
    });
    if (blocked) {
      throw new ForbiddenException("Messaging is blocked between these users");
    }

    const myThreads = await this.prisma.chatThread.findMany({
      where: {
        isActive: true,
        participants: { some: { userId, isActive: true } }
      },
      include: {
        participants: { where: { isActive: true } }
      }
    });

    const existing = myThreads.find(
      (thread) =>
        thread.participants.length === 2 &&
        thread.participants.some((p) => p.userId === recipientUserId)
    );
    if (existing) {
      return this.getThread(userId, existing.id);
    }

    const created = await this.prisma.chatThread.create({
      data: {
        title: null,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy,
        participants: {
          create: [
            { userId, lastUpdateIp: audit.ip, lastUpdateBy: audit.updatedBy },
            {
              userId: recipientUserId,
              lastUpdateIp: audit.ip,
              lastUpdateBy: audit.updatedBy
            }
          ]
        }
      },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });
    return created;
  }

  async createThread(userId: string, dto: CreateThreadDto, audit: AuditData) {
    await this.assertMessagingSubscription(userId);
    const allParticipants = Array.from(new Set([userId, ...dto.participantUserIds]));
    if (allParticipants.length < 2) {
      throw new BadRequestException("At least 2 participants required");
    }

    return this.prisma.chatThread.create({
      data: {
        title: dto.title,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy,
        participants: {
          create: allParticipants.map((participantId) => ({
            userId: participantId,
            lastUpdateIp: audit.ip,
            lastUpdateBy: audit.updatedBy
          }))
        }
      },
      include: {
        participants: { include: { user: true } }
      }
    });
  }

  async sendMessage(userId: string, threadId: string, dto: SendMessageDto, audit: AuditData) {
    await this.assertMessagingSubscription(userId);
    await this.assertThreadAccess(userId, threadId);

    const blockedByOtherUser = await this.prisma.chatBlockList.findFirst({
      where: {
        blockedUserId: userId,
        isActive: true,
        blockedBy: {
          chatThreadLinks: {
            some: {
              threadId,
              isActive: true
            }
          }
        }
      }
    });
    if (blockedByOtherUser) {
      throw new ForbiddenException("Messaging blocked by another participant");
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        threadId,
        senderUserId: userId,
        messageText: dto.messageText,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      include: {
        sender: { select: { id: true, fullName: true } }
      }
    });

    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: {
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return message;
  }

  async listThreads(userId: string) {
    const threads = await this.prisma.chatThread.findMany({
      where: {
        isActive: true,
        participants: {
          some: {
            userId,
            isActive: true
          }
        }
      },
      include: {
        participants: {
          where: { isActive: true },
          include: { user: { select: { id: true, fullName: true } } }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, fullName: true } } }
        }
      },
      orderBy: { lastUpdateAt: "desc" }
    });

    return Promise.all(
      threads.map(async (thread) => {
        const others = thread.participants.filter((p) => p.userId !== userId);
        const lastMessage = thread.messages[0] ?? null;
        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            threadId: thread.id,
            senderUserId: { not: userId },
            isSeen: false,
            isActive: true
          }
        });
        return {
          id: thread.id,
          title: thread.title,
          otherUser: others[0]?.user ?? null,
          lastMessage,
          updatedAt: thread.lastUpdateAt,
          unreadCount
        };
      })
    );
  }

  /** Opens a direct thread without requiring messaging subscription (feedback → admins). */
  private async findOrCreateDirectThreadInternal(
    userId: string,
    recipientUserId: string,
    audit: AuditData
  ) {
    if (userId === recipientUserId) {
      throw new BadRequestException("Cannot message yourself");
    }

    const myThreads = await this.prisma.chatThread.findMany({
      where: {
        isActive: true,
        participants: { some: { userId, isActive: true } }
      },
      include: {
        participants: { where: { isActive: true } }
      }
    });

    const existing = myThreads.find(
      (thread) =>
        thread.participants.length === 2 &&
        thread.participants.some((p) => p.userId === recipientUserId)
    );
    if (existing) {
      return existing;
    }

    return this.prisma.chatThread.create({
      data: {
        title: null,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy,
        participants: {
          create: [
            { userId, lastUpdateIp: audit.ip, lastUpdateBy: audit.updatedBy },
            {
              userId: recipientUserId,
              lastUpdateIp: audit.ip,
              lastUpdateBy: audit.updatedBy
            }
          ]
        }
      }
    });
  }

  private async createMessageInternal(
    userId: string,
    threadId: string,
    messageText: string,
    audit: AuditData
  ) {
    const message = await this.prisma.chatMessage.create({
      data: {
        threadId,
        senderUserId: userId,
        messageText,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { lastUpdateIp: audit.ip, lastUpdateBy: audit.updatedBy }
    });
    return message;
  }

  async notifyAdminsViaChat(
    fromUserId: string,
    subject: string,
    body: string,
    audit: AuditData
  ) {
    const adminLinks = await this.prisma.userRoleLink.findMany({
      where: {
        isActive: true,
        groupId: { in: [GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin] }
      },
      select: { userId: true }
    });
    const adminIds = [...new Set(adminLinks.map((l) => l.userId))].filter(
      (id) => id !== fromUserId
    );

    const sender = await this.prisma.userAccount.findUnique({
      where: { id: fromUserId },
      select: { fullName: true, email: true, mobileNumber: true }
    });
    const contact = sender?.email ?? sender?.mobileNumber ?? fromUserId;
    const text = `📩 Feedback: ${subject}\n\n${body}\n\n— ${sender?.fullName ?? "User"} (${contact})`;

    for (const adminId of adminIds) {
      const thread = await this.findOrCreateDirectThreadInternal(fromUserId, adminId, audit);
      await this.createMessageInternal(fromUserId, thread.id, text, audit);
    }

    return { notifiedCount: adminIds.length };
  }

  async getThread(userId: string, threadId: string) {
    await this.assertThreadAccess(userId, threadId);
    return this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        participants: {
          where: { isActive: true },
          include: { user: { select: { id: true, fullName: true } } }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
  }

  async listMessages(userId: string, threadId: string) {
    await this.assertThreadAccess(userId, threadId);
    return this.prisma.chatMessage.findMany({
      where: { threadId, isActive: true },
      include: {
        sender: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: "asc" }
    });
  }

  async getThreadRecipientIds(threadId: string, senderUserId: string) {
    const participants = await this.prisma.chatThreadParticipant.findMany({
      where: { threadId, isActive: true },
      select: { userId: true }
    });
    return participants.map((p) => p.userId).filter((id) => id !== senderUserId);
  }

  async markSeen(userId: string, threadId: string, audit: AuditData) {
    await this.assertThreadAccess(userId, threadId);

    const latestMessage = await this.prisma.chatMessage.findFirst({
      where: { threadId, isActive: true },
      orderBy: { createdAt: "desc" }
    });

    await this.prisma.chatMessage.updateMany({
      where: {
        threadId,
        senderUserId: { not: userId },
        isSeen: false,
        isActive: true
      },
      data: {
        isSeen: true,
        seenAt: new Date(),
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return this.prisma.chatReadState.upsert({
      where: {
        threadId_userId: {
          threadId,
          userId
        }
      },
      create: {
        threadId,
        userId,
        lastReadMessageId: latestMessage?.id,
        lastReadAt: new Date(),
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      update: {
        lastReadMessageId: latestMessage?.id,
        lastReadAt: new Date(),
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  blockUser(userId: string, dto: BlockUserDto, audit: AuditData) {
    if (dto.blockedUserId === userId) {
      throw new BadRequestException("Cannot block self");
    }
    return this.prisma.chatBlockList.upsert({
      where: {
        blockedByUserId_blockedUserId: {
          blockedByUserId: userId,
          blockedUserId: dto.blockedUserId
        }
      },
      create: {
        blockedByUserId: userId,
        blockedUserId: dto.blockedUserId,
        reason: dto.reason,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      update: {
        reason: dto.reason,
        isActive: true,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async unblockUser(userId: string, blockedUserId: string, audit: AuditData) {
    const existing = await this.prisma.chatBlockList.findUnique({
      where: {
        blockedByUserId_blockedUserId: {
          blockedByUserId: userId,
          blockedUserId
        }
      }
    });
    if (!existing) {
      return { ok: true };
    }
    return this.prisma.chatBlockList.update({
      where: {
        blockedByUserId_blockedUserId: {
          blockedByUserId: userId,
          blockedUserId
        }
      },
      data: {
        isActive: false,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async getBlockStatus(userId: string, otherUserId: string) {
    const block = await this.prisma.chatBlockList.findFirst({
      where: {
        isActive: true,
        OR: [
          { blockedByUserId: userId, blockedUserId: otherUserId },
          { blockedByUserId: otherUserId, blockedUserId: userId }
        ]
      }
    });
    return {
      blocked: Boolean(block),
      blockedByMe: block?.blockedByUserId === userId,
      blockedByThem: block?.blockedByUserId === otherUserId
    };
  }

  private async assertThreadAccess(userId: string, threadId: string) {
    const participant = await this.prisma.chatThreadParticipant.findFirst({
      where: {
        threadId,
        userId,
        isActive: true
      }
    });
    if (!participant) {
      throw new NotFoundException("Thread not found or access denied");
    }
  }
}
