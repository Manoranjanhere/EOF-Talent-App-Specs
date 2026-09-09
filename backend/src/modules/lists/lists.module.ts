import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { ListsController } from "./lists.controller";
import { ListsService } from "./lists.service";

@Module({
  imports: [StorageModule],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService]
})
export class ListsModule {}
