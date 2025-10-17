import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TranscriptionService } from './transcription.service';
import { TranscriptionController } from './transcription.controller';
import { AssemblyAiProvider } from '@providers/assemblyai/assemblyai.provider';
import { STT_PROVIDER } from '@common/constants/tokens';
import type { SttConfig } from '@config/stt.config';

/**
 * Transcription module
 * Provides speech-to-text transcription functionality with pluggable provider support
 */
@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [TranscriptionController],
  providers: [
    TranscriptionService,
    AssemblyAiProvider,
    {
      provide: STT_PROVIDER,
      useFactory: (configService: ConfigService, assemblyAi: AssemblyAiProvider) => {
        const config = configService.get<SttConfig>('stt');
        const provider = config?.defaultProvider ?? 'assemblyai';

        // Factory pattern: select provider based on configuration
        if (provider === 'assemblyai') {
          return assemblyAi;
        }

        // Future providers can be added here
        throw new Error(`Unknown STT provider: ${provider}`);
      },
      inject: [ConfigService, AssemblyAiProvider],
    },
  ],
})
export class TranscriptionModule {}
