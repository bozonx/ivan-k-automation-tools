import { Body, Controller, Post } from '@nestjs/common';
import { TranscribeFileDto } from '../../common/dto/transcribe-file.dto';
import { TranscriptionService } from './transcription.service';

@Controller()
export class TranscriptionController {
  constructor(private readonly service: TranscriptionService) {}

  @Post('api/v1/transcriptions/file')
  async transcribe(@Body() dto: TranscribeFileDto) {
    return this.service.transcribeByUrl(dto);
  }
}
