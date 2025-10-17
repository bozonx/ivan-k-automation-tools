import { Body, Controller, Post, Logger } from '@nestjs/common';
import { TranscribeFileDto } from '../../common/dto/transcribe-file.dto';
import { TranscriptionService } from './transcription.service';

@Controller('transcriptions')
export class TranscriptionController {
  private readonly logger = new Logger(TranscriptionController.name);

  constructor(private readonly service: TranscriptionService) {}

  @Post('file')
  public async transcribe(@Body() dto: TranscribeFileDto) {
    this.logger.log(`Transcription request received for URL: ${dto.audioUrl}`);
    const result = await this.service.transcribeByUrl(dto);
    this.logger.log(
      `Transcription request completed. Provider: ${result.provider}, Processing time: ${result.processingMs}ms`,
    );
    return result;
  }
}
