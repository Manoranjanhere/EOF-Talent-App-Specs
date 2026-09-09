import { Module } from "@nestjs/common";
import { ChatModule } from "../chat/chat.module";
import { StorageModule } from "../storage/storage.module";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";

@Module({
  imports: [ChatModule, StorageModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService]
})
export class JobsModule {}
