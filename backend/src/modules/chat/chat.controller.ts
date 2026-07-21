import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ChatService } from "./chat.service";
import { CreateThreadDto } from "./dto/create-thread.dto";
import { DirectThreadDto } from "./dto/direct-thread.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { BlockUserDto } from "./dto/block-user.dto";
import { ChatGateway } from "./chat.gateway";

@ApiTags("chat")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  @Get("messaging-status")
  messagingStatus(@CurrentUser() user: { userId: string }) {
    return this.chatService.messagingStatus(user.userId);
  }

  @Get("threads")
  listThreads(@CurrentUser() user: { userId: string }) {
    return this.chatService.listThreads(user.userId);
  }

  @Post("direct")
  async startDirectThread(
    @CurrentUser() user: { userId: string },
    @Body() dto: DirectThreadDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.chatService.findOrCreateDirectThread(user.userId, dto.recipientUserId, audit);
  }

  @Post("threads")
  createThread(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateThreadDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.chatService.createThread(user.userId, dto, audit);
  }

  @Get("threads/:threadId/messages")
  listMessages(
    @CurrentUser() user: { userId: string },
    @Param("threadId") threadId: string
  ) {
    return this.chatService.listMessages(user.userId, threadId);
  }

  @Post("threads/:threadId/messages")
  async sendMessage(
    @CurrentUser() user: { userId: string },
    @Param("threadId") threadId: string,
    @Body() dto: SendMessageDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    const message = await this.chatService.sendMessage(user.userId, threadId, dto, audit);
    const recipients = await this.chatService.getThreadRecipientIds(threadId, user.userId);
    this.chatGateway.notifyNewMessage(threadId, message, recipients);
    return message;
  }

  @Patch("threads/:threadId/seen")
  async markSeen(
    @CurrentUser() user: { userId: string },
    @Param("threadId") threadId: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    const result = await this.chatService.markSeen(user.userId, threadId, audit);
    this.chatGateway.notifyThreadSeen(threadId, user.userId);
    return result;
  }

  @Post("block")
  blockUser(
    @CurrentUser() user: { userId: string },
    @Body() dto: BlockUserDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.chatService.blockUser(user.userId, dto, audit);
  }

  @Patch("unblock/:blockedUserId")
  unblockUser(
    @CurrentUser() user: { userId: string },
    @Param("blockedUserId") blockedUserId: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.chatService.unblockUser(user.userId, blockedUserId, audit);
  }

  @Get("block-status/:otherUserId")
  blockStatus(
    @CurrentUser() user: { userId: string },
    @Param("otherUserId") otherUserId: string
  ) {
    return this.chatService.getBlockStatus(user.userId, otherUserId);
  }
}
