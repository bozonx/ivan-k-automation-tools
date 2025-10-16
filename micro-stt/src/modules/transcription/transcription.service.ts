import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  GatewayTimeoutException,
  HttpException,
} from '@nestjs/common';
import { lastValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { loadSttConfig } from '../../config/stt.config';
import { AssemblyAiProvider } from '../../providers/assemblyai/assemblyai.provider';
import { SttProvider, TranscriptionResult } from '../../common/interfaces/stt-provider.interface';

function isPrivateHost(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
  // Basic heuristic for private networks; full DNS/IP resolution is out-of-scope for now
  return false;
}

@Injectable()
export class TranscriptionService {
  private readonly cfg = loadSttConfig();

  constructor(
    private readonly http: HttpService,
    private readonly assembly: AssemblyAiProvider,
  ) {}

  private selectProvider(name?: string): SttProvider {
    const providerName = (name || this.cfg.defaultProvider).toLowerCase();
    if (!this.cfg.allowedProviders.includes(providerName)) {
      throw new BadRequestException('Unsupported provider');
    }
    switch (providerName) {
      case 'assemblyai':
        return this.assembly;
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  private async enforceSizeLimitIfKnown(audioUrl: string) {
    try {
      const req$ = this.http.head(audioUrl, { validateStatus: () => true });
      const res = await lastValueFrom(req$.pipe(timeout(this.cfg.requestTimeoutSec * 1000)));
      const len = res.headers['content-length']
        ? parseInt(res.headers['content-length'], 10)
        : undefined;
      if (len && len > this.cfg.maxFileMb * 1024 * 1024) {
        throw new BadRequestException('File too large');
      }
    } catch (e) {
      // HEAD may fail or be blocked; we ignore unless explicit oversized length was detected
    }
  }

  async transcribeByUrl(params: {
    audioUrl: string;
    provider?: string;
    timestamps?: boolean;
    apiKey?: string;
  }): Promise<{
    text: string;
    provider: string;
    requestId: string;
    durationSec?: number;
    language?: string;
    confidenceAvg?: number;
    wordsCount?: number;
    processingMs: number;
    timestampsEnabled: boolean;
  }> {
    let parsed: URL;
    try {
      parsed = new URL(params.audioUrl);
    } catch {
      throw new BadRequestException('audioUrl must be a valid URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Only http(s) URLs are allowed');
    }
    if (isPrivateHost(parsed)) {
      throw new BadRequestException('Private/loopback hosts are not allowed');
    }

    await this.enforceSizeLimitIfKnown(params.audioUrl);

    const provider = this.selectProvider(params.provider);

    const apiKeyToUse =
      this.cfg.allowCustomApiKey && params.apiKey ? params.apiKey : this.cfg.assemblyAiApiKey;
    if (!apiKeyToUse) {
      throw new UnauthorizedException('Missing provider API key');
    }

    const start = Date.now();
    let result: TranscriptionResult;
    try {
      result = await provider.submitAndWaitByUrl({
        audioUrl: params.audioUrl,
        apiKey: apiKeyToUse,
      });
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new GatewayTimeoutException('TRANSCRIPTION_TIMEOUT');
    }
    const processingMs = Date.now() - start;

    return {
      text: result.text,
      provider: (params.provider || this.cfg.defaultProvider).toLowerCase(),
      requestId: result.requestId,
      durationSec: result.durationSec,
      language: result.language,
      confidenceAvg: result.confidenceAvg,
      wordsCount: result.words?.length,
      processingMs,
      timestampsEnabled: Boolean(params.timestamps),
    };
  }
}
