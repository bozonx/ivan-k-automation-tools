import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  const port = parseInt(process.env.LISTEN_PORT ?? '3001', 10);
  const host = process.env.LISTEN_HOST ?? 'localhost';

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Configure global API prefix from environment variables
  const apiBasePath = (process.env.API_BASE_PATH ?? 'api').replace(/^\/+|\/+$/g, '');
  const apiVersion = (process.env.API_VERSION ?? 'v1').replace(/^\/+|\/+$/g, '');
  const globalPrefix = `${apiBasePath}/${apiVersion}`;
  app.setGlobalPrefix(globalPrefix);

  await app.listen(port, host);
}

void bootstrap();
