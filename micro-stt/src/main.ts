import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  const port = parseInt(process.env.LISTEN_PORT || '3001', 10);
  const host = process.env.LISTEN_HOST || '0.0.0.0';

  await app.listen(port, host);
}

bootstrap();
