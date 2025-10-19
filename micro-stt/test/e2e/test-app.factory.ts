import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '@/app.module';
import rateLimit from '@fastify/rate-limit';
import type { FastifyRequest } from 'fastify';

export async function createTestApp(): Promise<NestFastifyApplication> {
  // Ensure defaults the same as in main.ts
  process.env.API_BASE_PATH = process.env.API_BASE_PATH ?? 'api';
  process.env.API_VERSION = process.env.API_VERSION ?? 'v1';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const apiBasePath = (process.env.API_BASE_PATH || 'api').replace(/^\/+|\/+$/g, '');
  const apiVersion = (process.env.API_VERSION || 'v1').replace(/^\/+|\/+$/g, '');
  app.setGlobalPrefix(`${apiBasePath}/${apiVersion}`);

  // Register rate limiter similar to main.ts, using env defaults for tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (app as any).register(rateLimit as any, {
    max: parseInt((process.env.RATE_LIMIT_MAX ?? '5') as string, 10),
    timeWindow: (process.env.RATE_LIMIT_WINDOW ?? '10 seconds') as string,
    keyGenerator: (req: FastifyRequest) =>
      (req.headers['authorization'] as string) || (req.headers['x-api-key'] as string) || req.ip,
    allowList: (req: FastifyRequest) =>
      (req.url?.includes('/health') ?? false) || (req.url?.includes('/api/docs') ?? false),
  });

  await app.init();
  // Ensure Fastify has completed plugin registration and routing before tests
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
