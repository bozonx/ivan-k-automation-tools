import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionModule } from './modules/transcription/transcription.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TranscriptionModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
