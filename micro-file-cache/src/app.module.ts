import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getConfig } from './config/app.config';
import { HealthController } from './common/controllers/health.controller';

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
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
