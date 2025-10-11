/**
 * E2E тесты для проверки аутентификации
 * Тестирует различные сценарии аутентификации и авторизации
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getConfig } from '../../src/config/app.config';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Authentication E2E Tests', () => {
  let app: NestFastifyApplication;
  let testStoragePath: string;
  let validToken: string;

  beforeAll(async () => {
    // Тестовая конфигурация уже загружена автоматически через setup.ts

    // Создаем временную директорию для тестов в корне репозитория
    testStoragePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'test-data',
      'micro-file-cache',
      'temp-storage-auth',
    );
    await fs.ensureDir(testStoragePath);

    // Получаем конфигурацию для тестов
    const config = getConfig();
    validToken = process.env.AUTH_SECRET_KEY || 'test-secret-key';

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
              enabled: true,
              secretKey: validToken,
            },
          };
          return testConfig[key] || process.env[key];
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
    app.setGlobalPrefix(config.server.apiPrefix + '/' + config.server.apiVersion);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    if (await fs.pathExists(testStoragePath)) {
      await fs.remove(testStoragePath);
    }
  });

  beforeEach(async () => {
    // Очищаем хранилище перед каждым тестом
    if (await fs.pathExists(testStoragePath)) {
      await fs.emptyDir(testStoragePath);
    }
  });

  describe('Health Check (No Auth Required)', () => {
    it('should allow access to health endpoint without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('File Operations (Auth Required)', () => {
    it('should reject file upload without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401);
    });

    it('should reject file upload with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401);
    });

    it('should reject file upload with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', 'InvalidFormat token')
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401);
    });

    it('should reject file upload without Bearer prefix', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', validToken)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401);
    });

    it('should allow file upload with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(201);

      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('id');
      expect(response.body.file.originalName).toBe('test.txt');
    });

    it('should reject file list without authentication', async () => {
      await request(app.getHttpServer()).get('/api/v1/files').expect(401);
    });

    it('should allow file list with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should reject file stats without authentication', async () => {
      await request(app.getHttpServer()).get('/api/v1/files/stats').expect(401);
    });

    it('should allow file stats with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files/stats')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalFiles');
      expect(response.body.stats).toHaveProperty('totalSize');
    });
  });

  describe('Token Validation Edge Cases', () => {
    it('should handle empty authorization header', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', '')
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401);
    });

    it('should handle authorization header with only Bearer', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', 'Bearer ')
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401);
    });

    it('should handle authorization header with spaces', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer  ${validToken}  `)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401); // Пробелы в токене не обрезаются
    });

    it('should handle case-insensitive Bearer prefix', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `bearer ${validToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401); // Должно быть чувствительно к регистру
    });
  });

  describe('Error Response Format', () => {
    it('should return proper 401 error format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/files')
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Authorization token is required');
    });
  });
});
