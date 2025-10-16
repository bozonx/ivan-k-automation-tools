import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TranscriptionService } from './transcription.service';
import { TranscriptionController } from './transcription.controller';
import { AssemblyAiProvider } from '../../providers/assemblyai/assemblyai.provider';

@Module({
  imports: [HttpModule],
  controllers: [TranscriptionController],
  providers: [TranscriptionService, AssemblyAiProvider],
})
export class TranscriptionModule {}
