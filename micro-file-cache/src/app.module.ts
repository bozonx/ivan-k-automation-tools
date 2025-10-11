import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getConfig } from './config/app.config';
import { HealthController } from './common/controllers/health.controller';
import { StorageTestController } from './common/controllers/storage-test.controller';
import { StorageModule } from './modules/storage/storage.module';

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
  ],
  controllers: [HealthController, StorageTestController],
  providers: [],
})
export class AppModule {}
