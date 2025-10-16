import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException, GatewayTimeoutException } from '@nestjs/common';
import { lastValueFrom, timeout } from 'rxjs';
import {
  SttProvider,
  TranscriptionRequestByUrl,
  TranscriptionResult,
} from '../../common/interfaces/stt-provider.interface';
import { loadSttConfig } from '../../config/stt.config';

interface AssemblyCreateResponse {
  id: string;
  status: string;
}

interface AssemblyTranscriptResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
  words?: Array<{ start: number; end: number; text: string; confidence?: number }>;
  audio_duration?: number;
  language_code?: string;
  confidence?: number; // some payloads expose average confidence
}

@Injectable()
export class AssemblyAiProvider implements SttProvider {
  private readonly cfg = loadSttConfig();

  constructor(private readonly http: HttpService) {}

  async submitAndWaitByUrl(params: TranscriptionRequestByUrl): Promise<TranscriptionResult> {
    const headers = { Authorization: params.apiKey as string };
    const create$ = this.http.post<AssemblyCreateResponse>(
      'https://api.assemblyai.com/v2/transcripts',
      { audio_url: params.audioUrl },
      { headers, validateStatus: () => true },
    );
    const createRes = await lastValueFrom(create$.pipe(timeout(this.cfg.requestTimeoutSec * 1000)));
    if (createRes.status >= 400 || !createRes.data?.id) {
      throw new ServiceUnavailableException('Failed to create transcription');
    }

    const id = createRes.data.id;
    const startedAt = Date.now();
    const deadline = startedAt + this.cfg.maxSyncWaitMin * 60 * 1000;

    // Poll loop
    for (;;) {
      if (Date.now() > deadline) {
        throw new GatewayTimeoutException('TRANSCRIPTION_TIMEOUT');
      }
      await new Promise((r) => setTimeout(r, this.cfg.pollIntervalMs));
      const get$ = this.http.get<AssemblyTranscriptResponse>(
        `https://api.assemblyai.com/v2/transcripts/${id}`,
        {
          headers,
          validateStatus: () => true,
        },
      );
      const getRes = await lastValueFrom(get$.pipe(timeout(this.cfg.requestTimeoutSec * 1000)));
      const body = getRes.data;
      if (!body) continue;
      if (body.status === 'completed') {
        return {
          text: body.text || '',
          requestId: id,
          durationSec: body.audio_duration,
          language: body.language_code,
          confidenceAvg: body.confidence,
          words:
            body.words?.map((w) => ({ start: w.start, end: w.end, text: w.text })) || undefined,
        };
      }
      if (body.status === 'error') {
        throw new ServiceUnavailableException(body.error || 'Transcription failed');
      }
    }
  }
}
