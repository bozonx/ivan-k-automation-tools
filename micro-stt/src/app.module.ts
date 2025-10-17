import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionModule } from './modules/transcription/transcription.module';
import { HealthController } from './health.controller';
import appConfig from './config/app.config';
import sttConfig from './config/stt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, sttConfig],
    }),
    TranscriptionModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
