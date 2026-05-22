import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: "*"
  }
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage("joinThread")
  async onJoinThread(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { threadId: string }
  ) {
    socket.join(body.threadId);
    return { ok: true };
  }

  @SubscribeMessage("sendMessage")
  async onSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    body: {
      userId: string;
      threadId: string;
      messageText: string;
    }
  ) {
    const message = await this.chatService.sendMessage(
      body.userId,
      body.threadId,
      { messageText: body.messageText },
      { ip: socket.handshake.address, updatedBy: body.userId }
    );
    this.server.to(body.threadId).emit("newMessage", message);
    return message;
  }
}
