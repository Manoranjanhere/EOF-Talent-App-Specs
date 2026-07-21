import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";

type ChatSocketData = {
  userId?: string;
};

type ChatSocket = Socket & { data: ChatSocketData };

/** Real-time chat notifications — messages are sent via authenticated HTTP API. */
@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: "*"
  }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async handleConnection(socket: ChatSocket) {
    const token = this.extractToken(socket);
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET")
      });
      if (!payload?.sub) {
        socket.disconnect(true);
        return;
      }
      socket.data.userId = payload.sub;
      await socket.join(`user:${payload.sub}`);
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(_socket: ChatSocket) {
    // Rooms are cleared automatically on disconnect.
  }

  @SubscribeMessage("joinThread")
  async onJoinThread(
    @ConnectedSocket() socket: ChatSocket,
    @MessageBody() body: { threadId?: string }
  ) {
    if (!socket.data.userId || !body?.threadId) {
      return { ok: false };
    }
    await socket.join(body.threadId);
    return { ok: true };
  }

  @SubscribeMessage("leaveThread")
  async onLeaveThread(
    @ConnectedSocket() socket: ChatSocket,
    @MessageBody() body: { threadId?: string }
  ) {
    if (!body?.threadId) {
      return { ok: false };
    }
    await socket.leave(body.threadId);
    return { ok: true };
  }

  notifyNewMessage(threadId: string, message: unknown, recipientUserIds: string[]) {
    this.server.to(threadId).emit("newMessage", message);
    for (const userId of recipientUserIds) {
      this.server.to(`user:${userId}`).emit("pushNotification", {
        type: "CHAT_MESSAGE",
        threadId,
        message
      });
    }
  }

  notifyThreadSeen(threadId: string, seenByUserId: string) {
    this.server.to(threadId).emit("threadSeen", { threadId, userId: seenByUserId });
  }

  private extractToken(socket: ChatSocket): string | null {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === "string" && authToken.length > 0) {
      return authToken;
    }
    const header = socket.handshake.headers?.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice(7);
    }
    return null;
  }
}
