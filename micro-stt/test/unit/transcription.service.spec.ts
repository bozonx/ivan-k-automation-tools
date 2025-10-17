import { Test } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionService } from '../../src/modules/transcription/transcription.service';
import { AssemblyAiProvider } from '../../src/providers/assemblyai/assemblyai.provider';
import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
import sttConfig from '../../src/config/stt.config';

describe('TranscriptionService', () => {
  it('rejects private host url', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          load: [appConfig, sttConfig],
        }),
      ],
      providers: [TranscriptionService, AssemblyAiProvider],
    })
      .overrideProvider(AssemblyAiProvider)
      .useValue({ submitAndWaitByUrl: jest.fn() })
      .compile();

    const svc = moduleRef.get(TranscriptionService);
    await expect(
      svc.transcribeByUrl({ audioUrl: 'http://localhost:8000/a.mp3' }),
    ).rejects.toThrow();
  });

  it('returns response shape on success', async () => {
    process.env.ASSEMBLYAI_API_KEY = 'x';
    const moduleRef = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          load: [appConfig, sttConfig],
        }),
      ],
      providers: [TranscriptionService, AssemblyAiProvider],
    })
      .overrideProvider(HttpService)
      .useValue({ head: () => of({ headers: {} }) })
      .overrideProvider(AssemblyAiProvider)
      .useValue({
        submitAndWaitByUrl: jest.fn().mockResolvedValue({
          text: 'hello',
          requestId: 'id1',
          durationSec: 1,
          language: 'en',
          confidenceAvg: 0.9,
          words: [{ start: 0, end: 100, text: 'hello' }],
        }),
      })
      .compile();

    const svc = moduleRef.get(TranscriptionService);
    const res = await svc.transcribeByUrl({ audioUrl: 'https://example.com/a.mp3' });
    expect(res.text).toBe('hello');
    expect(res.provider).toBe('assemblyai');
    expect(res.requestId).toBe('id1');
    expect(res.wordsCount).toBe(1);
  });
});
