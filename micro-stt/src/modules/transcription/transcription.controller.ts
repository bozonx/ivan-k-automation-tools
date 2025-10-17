import { Body, Controller, Post } from '@nestjs/common';
import { TranscribeFileDto } from '../../common/dto/transcribe-file.dto';
import { TranscriptionService } from './transcription.service';

@Controller('transcriptions')
export class TranscriptionController {
  constructor(private readonly service: TranscriptionService) {}

  @Post('file')
  public async transcribe(@Body() dto: TranscribeFileDto) {
    return this.service.transcribeByUrl(dto);
  }
}
