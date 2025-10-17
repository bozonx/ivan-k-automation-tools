import { Body, Controller, Post, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiGatewayTimeoutResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { TranscribeFileDto } from '../../common/dto/transcribe-file.dto';
import { TranscriptionResponseDto } from '../../common/dto/transcription-response.dto';
import { TranscriptionService } from './transcription.service';

@ApiTags('Transcriptions')
@Controller('transcriptions')
export class TranscriptionController {
  private readonly logger = new Logger(TranscriptionController.name);

  constructor(private readonly service: TranscriptionService) {}

  @Post('file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transcribe audio file from URL',
    description:
      'Transcribes an audio file from a publicly accessible URL using a speech-to-text provider. ' +
      'The audio file must be accessible via HTTP/HTTPS and not exceed the maximum file size limit.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transcription completed successfully',
    type: TranscriptionResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid request parameters (invalid URL, unsupported provider, file too large, private/loopback host)',
    schema: {
      example: {
        statusCode: 400,
        message: 'audioUrl must be a valid URL',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid API key',
    schema: {
      example: {
        statusCode: 401,
        message: 'Missing provider API key',
        error: 'Unauthorized',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Transcription service is unavailable or provider error',
    schema: {
      example: {
        statusCode: 503,
        message: 'Failed to create transcription',
        error: 'Service Unavailable',
      },
    },
  })
  @ApiGatewayTimeoutResponse({
    description: 'Transcription took too long to complete',
    schema: {
      example: {
        statusCode: 504,
        message: 'TRANSCRIPTION_TIMEOUT',
        error: 'Gateway Timeout',
      },
    },
  })
  public async transcribe(@Body() dto: TranscribeFileDto): Promise<TranscriptionResponseDto> {
    this.logger.log(`Transcription request received for URL: ${dto.audioUrl}`);
    const result = await this.service.transcribeByUrl(dto);
    this.logger.log(
      `Transcription request completed. Provider: ${result.provider}, Processing time: ${result.processingMs}ms`,
    );
    return result;
  }
}
