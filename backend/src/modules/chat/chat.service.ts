import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateThreadDto } from "./dto/create-thread.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { BlockUserDto } from "./dto/block-user.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createThread(userId: string, dto: CreateThreadDto, audit: AuditData) {
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
        participants: true
      }
    });
  }

  async sendMessage(userId: string, threadId: string, dto: SendMessageDto, audit: AuditData) {
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

    return this.prisma.chatMessage.create({
      data: {
        threadId,
        senderUserId: userId,
        messageText: dto.messageText,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async listThreads(userId: string) {
    return this.prisma.chatThread.findMany({
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
          include: { user: true }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { lastUpdateAt: "desc" }
    });
  }

  async listMessages(userId: string, threadId: string) {
    await this.assertThreadAccess(userId, threadId);
    return this.prisma.chatMessage.findMany({
      where: { threadId, isActive: true },
      orderBy: { createdAt: "asc" }
    });
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
