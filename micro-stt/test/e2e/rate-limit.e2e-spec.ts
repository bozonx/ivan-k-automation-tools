import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from './test-app.factory';
import { runWithEnvVars } from './env-helper';

describe('Rate limiting (e2e)', () => {
  let app: NestFastifyApplication;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns 429 on N+1 within window (public index route)', async () => {
    await runWithEnvVars(
      {
        RATE_LIMIT_MAX: '2',
        RATE_LIMIT_WINDOW: '1 second',
        AUTH_ENABLED: 'false',
      },
      async () => {
        app = await createTestApp();

        const path = '/api/v1'; // public and not allowListed
        const r1 = await app.inject({ method: 'GET', url: path });
        const r2 = await app.inject({ method: 'GET', url: path });
        const r3 = await app.inject({ method: 'GET', url: path });
        expect(r1.statusCode).toBe(200);
        expect(r2.statusCode).toBe(200);
        expect(r3.statusCode).toBe(429);
      },
    );
  });

  it('does not limit health endpoints (allowList)', async () => {
    await runWithEnvVars(
      {
        RATE_LIMIT_MAX: '1',
        RATE_LIMIT_WINDOW: '1 second',
        AUTH_ENABLED: 'false',
      },
      async () => {
        app = await createTestApp();

        const path = '/api/v1/health';
        for (let i = 0; i < 5; i++) {
          const res = await app.inject({ method: 'GET', url: path });
          expect(res.statusCode).toBe(200);
        }
      },
    );
  });

  it('uses Authorization as key (separate buckets)', async () => {
    await runWithEnvVars(
      {
        RATE_LIMIT_MAX: '2',
        RATE_LIMIT_WINDOW: '1 second',
        AUTH_ENABLED: 'false',
      },
      async () => {
        app = await createTestApp();

        const path = '/api/v1';
        const h1 = { authorization: 'Bearer A' };
        const h2 = { authorization: 'Bearer B' };

        expect((await app.inject({ method: 'GET', url: path, headers: h1 })).statusCode).toBe(200);
        expect((await app.inject({ method: 'GET', url: path, headers: h1 })).statusCode).toBe(200);
        expect((await app.inject({ method: 'GET', url: path, headers: h1 })).statusCode).toBe(429);

        // New bucket for another token
        expect((await app.inject({ method: 'GET', url: path, headers: h2 })).statusCode).toBe(200);
      },
    );
  });

  it('resets after window', async () => {
    await runWithEnvVars(
      {
        RATE_LIMIT_MAX: '1',
        RATE_LIMIT_WINDOW: '1 second',
        AUTH_ENABLED: 'false',
      },
      async () => {
        app = await createTestApp();

        const path = '/api/v1';
        const r1 = await app.inject({ method: 'GET', url: path });
        const r2 = await app.inject({ method: 'GET', url: path });
        expect(r1.statusCode).toBe(200);
        expect(r2.statusCode).toBe(429);

        await new Promise(r => setTimeout(r, 1100));

        const r3 = await app.inject({ method: 'GET', url: path });
        expect(r3.statusCode).toBe(200);
      },
    );
  });
});
