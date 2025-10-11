import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getConfig } from './config/app.config';
import { HealthController } from './common/controllers/health.controller';
import { StorageTestController } from './common/controllers/storage-test.controller';
import { StorageModule } from './modules/storage/storage.module';
import { FilesModule } from './modules/files/files.module';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';

@Module({
  imports: [
    // Глобальная конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [getConfig],
    }),

    // Модуль для cron jobs (автоматическая очистка)
    ScheduleModule.forRoot(),

    // Модуль для работы с файловым хранилищем
    StorageModule,

    // Модуль для работы с файлами (бизнес-логика)
    FilesModule,
  ],
  controllers: [HealthController, StorageTestController],
  providers: [
    // Глобальный пайп валидации
    {
      provide: APP_PIPE,
      useClass: GlobalValidationPipe,
    },
  ],
})
export class AppModule {}
