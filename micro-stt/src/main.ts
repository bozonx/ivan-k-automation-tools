import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const appConfig = configService.get<AppConfig>('app')!;

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Configure global API prefix from configuration
  const globalPrefix = `${appConfig.apiBasePath}/${appConfig.apiVersion}`;
  app.setGlobalPrefix(globalPrefix);

  await app.listen(appConfig.port, appConfig.host);

  logger.log(
    `🚀 Micro STT service is running on: http://${appConfig.host}:${appConfig.port}/${globalPrefix}`,
  );
  logger.log(`📊 Environment: ${appConfig.nodeEnv}`);
  logger.log(`📝 Log level: ${appConfig.logLevel}`);
}

void bootstrap();
