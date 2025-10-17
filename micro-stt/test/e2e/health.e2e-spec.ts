import { INestApplication } from '@nestjs/common';
import { createTestApp } from './test-app.factory';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/heartbeat returns ok', async () => {
    const fastify = (app as any).getHttpAdapter().getInstance();
    const res = await fastify.inject({ method: 'GET', url: '/api/v1/heartbeat' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('version');
  });
});
