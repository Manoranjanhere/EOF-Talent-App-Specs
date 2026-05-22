import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateFeedbackDto, audit: AuditData) {
    return this.prisma.helpFeedback.create({
      data: {
        userId,
        subject: dto.subject,
        message: dto.message,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  listForUser(userId: string) {
    return this.prisma.helpFeedback.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" }
    });
  }
}
