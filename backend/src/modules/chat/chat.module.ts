import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { StorageModule } from "../storage/storage.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [
    StorageModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_ACCESS_SECRET")
      })
    })
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService]
})
export class ChatModule {}
