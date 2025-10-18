import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { createTestApp } from './test-app.factory';

describe('Index (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    // Create fresh app instance for each test for better isolation
    app = await createTestApp();
  });

  afterEach(async () => {
    // Clean up app instance after each test
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1 returns API index with links', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'micro-stt');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('time');
    expect(res.body).toHaveProperty('links');
    expect(res.body.links).toMatchObject({
      self: '/api/v1',
      docs: '/api/docs',
      health: '/api/v1/health',
      transcriptions: '/api/v1/transcriptions',
    });
  });
});
