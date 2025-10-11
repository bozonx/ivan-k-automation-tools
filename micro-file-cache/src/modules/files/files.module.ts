import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { StorageModule } from '../storage/storage.module';

/**
 * Модуль для работы с файлами
 * Предоставляет бизнес-логику для операций с файлами
 */
@Module({
  imports: [StorageModule],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
