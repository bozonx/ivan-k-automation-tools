import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { AppConfig } from './config/app.config';

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

  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Micro STT API')
    .setDescription(
      'Speech-to-Text microservice API for transcribing audio files. ' +
        'Supports multiple STT providers and provides asynchronous transcription with polling.',
    )
    .setVersion('0.8.0')
    .addTag('Transcriptions', 'Endpoints for transcribing audio files')
    .addTag('Health', 'Health check endpoints for monitoring and orchestration')
    .addServer(`http://${appConfig.host}:${appConfig.port}`, 'Local development server')
    .addServer('/', 'Current server')
    .setContact('Ivan K.', '', '')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Micro STT API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(appConfig.port, appConfig.host);

  logger.log(
    `🚀 Micro STT service is running on: http://${appConfig.host}:${appConfig.port}/${globalPrefix}`,
  );
  logger.log(
    `📚 API Documentation available at: http://${appConfig.host}:${appConfig.port}/api/docs`,
  );
  logger.log(`📊 Environment: ${appConfig.nodeEnv}`);
  logger.log(`📝 Log level: ${appConfig.logLevel}`);
}

void bootstrap();
