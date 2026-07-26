import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ChatService } from "../chat/chat.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class FeedbackService {
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

    await this.chatService.notifySuperAdminsViaChat(
      userId,
      dto.subject,
      dto.message,
      audit
    );

    return feedback;
  }

  listForUser(userId: string) {
    return this.prisma.helpFeedback.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" }
    });
  }
}
