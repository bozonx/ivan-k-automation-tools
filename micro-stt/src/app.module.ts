import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranscriptionModule } from './modules/transcription/transcription.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TranscriptionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
