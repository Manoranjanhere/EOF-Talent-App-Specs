import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { MediaController } from "./media.controller";
import { MediaFilesController } from "./media-files.controller";
import { MediaService } from "./media.service";

@Module({
  imports: [StorageModule],
  controllers: [MediaController, MediaFilesController],
  providers: [MediaService],
  exports: [MediaService]
})
export class MediaModule {}
