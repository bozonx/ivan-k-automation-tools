import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './test-app.factory';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('returns health check with status', async () => {
      const server = app.getHttpServer();
      const res = await request(server).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('info');
      expect(res.body).toHaveProperty('details');
    });

    it('includes service health check', async () => {
      const server = app.getHttpServer();
      const res = await request(server).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.details).toHaveProperty('service');
      expect(res.body.details.service).toHaveProperty('status', 'up');
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('returns readiness probe status', async () => {
      const server = app.getHttpServer();
      const res = await request(server).get('/api/v1/health/ready');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.details).toHaveProperty('ready');
    });
  });

  describe('GET /api/v1/health/live', () => {
    it('returns liveness probe with uptime', async () => {
      const server = app.getHttpServer();
      const res = await request(server).get('/api/v1/health/live');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.details).toHaveProperty('uptime');
      expect(res.body.details.uptime).toHaveProperty('uptime');
      expect(typeof res.body.details.uptime.uptime).toBe('number');
    });
  });
});
