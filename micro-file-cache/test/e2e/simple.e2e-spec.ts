/**
 * Простой E2E тест для проверки базовой функциональности
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getConfig } from '../../src/config/app.config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';

describe('Simple E2E Test', () => {
  let app: INestApplication;
  let testStoragePath: string;

  beforeAll(async () => {
    // Загружаем тестовую конфигурацию
    const testEnvPath = path.join(__dirname, '..', '..', 'env.test');
    dotenv.config({ path: testEnvPath });

    // Создаем временную директорию для тестов в корне репозитория
    testStoragePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'test-data',
      'micro-file-cache',
      'temp-storage-simple',
    );
    await fs.ensureDir(testStoragePath);

    // Получаем конфигурацию для тестов
    const config = getConfig();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('ConfigService')
      .useValue({
        get: (key: string) => {
          const testConfig = {
            ...config,
            storage: {
              ...config.storage,
              basePath: testStoragePath,
            },
            auth: {
              ...config.auth,
              enabled: false, // Отключаем аутентификацию для простого теста
            },
          };
          return testConfig[key] || config[key];
        },
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    // Регистрируем multipart для загрузки файлов
    await (app as NestFastifyApplication).register(require('@fastify/multipart'), {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB для тестов
      },
    });

    // Настраиваем глобальные пайпы
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Установка глобального префикса для API
    app.setGlobalPrefix('api/v1');

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    // Очищаем временную директорию
    if (await fs.pathExists(testStoragePath)) {
      await fs.remove(testStoragePath);
    }
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should have HTTP server', () => {
    expect(app.getHttpServer()).toBeDefined();
  });

  it('should respond to health check', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version');
  });

  it('should require authentication for files endpoint', async () => {
    await request(app.getHttpServer()).get('/api/v1/files').expect(401);
  });
});
