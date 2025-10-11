/**
 * E2E тесты для основного приложения
 * Тестирует базовую функциональность и интеграцию всех модулей
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getConfig } from '../../src/config/app.config';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let testStoragePath: string;
  let validToken: string;

  beforeAll(async () => {
    // Создаем временную директорию для тестов
    testStoragePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'test-data',
      'micro-file-cache',
      'temp-storage',
    );
    await fs.ensureDir(testStoragePath);

    // Получаем конфигурацию для тестов
    const config = getConfig();
    validToken = config.auth.secretKey || 'test-secret-key-12345678901234567890';

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
          return testConfig[key] || config[key];
        },
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    // Регистрируем multipart для загрузки файлов
    await (app as NestFastifyApplication).register(require('@fastify/multipart'), {
      limits: {
        fileSize: config.storage.maxFileSize,
      },
    });

    // Устанавливаем глобальный префикс для API (как в main.ts)
    app.setGlobalPrefix(config.server.apiPrefix + '/' + config.server.apiVersion);

    // Настраиваем глобальные пайпы
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

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

  beforeEach(async () => {
    // Очищаем хранилище перед каждым тестом
    if (await fs.pathExists(testStoragePath)) {
      await fs.emptyDir(testStoragePath);
    }
  });

  describe('Health Check', () => {
    it('should return health status without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('storage');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('checks');
          expect(['healthy', 'unhealthy', 'degraded']).toContain(res.body.status);
        });
    });

    it('should include storage information in health check', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.storage).toHaveProperty('isAvailable');
          expect(res.body.storage).toHaveProperty('freeSpace');
          expect(res.body.storage).toHaveProperty('totalSpace');
          expect(res.body.storage).toHaveProperty('usedSpace');
          expect(res.body.storage).toHaveProperty('usagePercentage');
          expect(res.body.storage).toHaveProperty('fileCount');
          expect(res.body.storage).toHaveProperty('lastChecked');
        });
    });

    it('should include system checks in health check', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.checks).toHaveProperty('filesystem');
          expect(res.body.checks).toHaveProperty('memory');
          expect(res.body.checks.filesystem).toHaveProperty('status');
          expect(res.body.checks.filesystem).toHaveProperty('message');
          expect(res.body.checks.filesystem).toHaveProperty('lastChecked');
          expect(res.body.checks.memory).toHaveProperty('status');
          expect(res.body.checks.memory).toHaveProperty('message');
          expect(res.body.checks.memory).toHaveProperty('lastChecked');
        });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without authorization header', () => {
      return request(app.getHttpServer())
        .get('/api/v1/files')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Authorization token is required');
        });
    });

    it('should reject requests with invalid authorization header format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Authorization token is required');
        });
    });

    it('should reject requests with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid authorization token');
        });
    });

    it('should accept requests with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('files');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('should accept requests with valid long token', () => {
      const longToken = 'a'.repeat(32); // 32 символа
      return request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${longToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('files');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('pagination');
        });
    });
  });

  describe('File Operations', () => {
    let uploadedFileId: string;

    it('should upload a file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .field('ttl', '3600')
        .field('metadata', JSON.stringify({ description: 'Test file' }))
        .expect(201);

      expect(response.body).toHaveProperty('file');
      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body).toHaveProperty('infoUrl');
      expect(response.body).toHaveProperty('deleteUrl');
      expect(response.body).toHaveProperty('message');
      expect(response.body.file).toHaveProperty('id');
      expect(response.body.file).toHaveProperty('originalName', 'test.txt');
      expect(response.body.file).toHaveProperty('mimeType');
      expect(response.body.file).toHaveProperty('size');
      expect(response.body.file).toHaveProperty('uploadedAt');
      expect(response.body.file).toHaveProperty('ttl', 3600);
      expect(response.body.file).toHaveProperty('expiresAt');
      expect(response.body.file).toHaveProperty('hash');
      expect(response.body.file).toHaveProperty('isExpired', false);
      expect(response.body.file).toHaveProperty('timeRemaining');

      uploadedFileId = response.body.file.id;
    });

    it('should get file information', async () => {
      // Сначала загружаем файл
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .expect(201);

      const fileId = uploadResponse.body.file.id;

      // Получаем информацию о файле
      const response = await request(app.getHttpServer())
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('file');
      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body).toHaveProperty('deleteUrl');
      expect(response.body.file).toHaveProperty('id', fileId);
      expect(response.body.file).toHaveProperty('originalName', 'test.txt');
    });

    it('should download a file', async () => {
      // Сначала загружаем файл
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .expect(201);

      const fileId = uploadResponse.body.file.id;

      // Скачиваем файл
      const response = await request(app.getHttpServer())
        .get(`/api/v1/files/${fileId}/download`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('test.txt');
      expect(response.text).toBe('test file content');
    });

    it('should delete a file', async () => {
      // Сначала загружаем файл
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .expect(201);

      const fileId = uploadResponse.body.file.id;

      // Удаляем файл
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('fileId', fileId);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('deletedAt');

      // Проверяем, что файл действительно удален
      await request(app.getHttpServer())
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });

    it('should list files', async () => {
      // Загружаем несколько файлов
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test file 1'), 'test1.txt')
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test file 2'), 'test2.txt')
        .expect(201);

      // Получаем список файлов
      const response = await request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(response.body.files.length).toBeGreaterThanOrEqual(2);
      expect(response.body.total).toBeGreaterThanOrEqual(2);
    });

    it('should get file statistics', async () => {
      // Загружаем файл для статистики
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .expect(201);

      // Получаем статистику
      const response = await request(app.getHttpServer())
        .get('/api/v1/files/stats')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('generatedAt');
      expect(response.body.stats).toHaveProperty('totalFiles');
      expect(response.body.stats).toHaveProperty('totalSize');
      expect(response.body.stats).toHaveProperty('filesByMimeType');
      expect(response.body.stats).toHaveProperty('filesByDate');
    });

    it('should check if file exists', async () => {
      // Сначала загружаем файл
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .expect(201);

      const fileId = uploadResponse.body.file.id;

      // Проверяем существование файла
      const response = await request(app.getHttpServer())
        .get(`/api/v1/files/${fileId}/exists`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('exists', true);
      expect(response.body).toHaveProperty('fileId', fileId);
      expect(response.body).toHaveProperty('isExpired', false);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent file', () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      return request(app.getHttpServer())
        .get(`/api/v1/files/${nonExistentId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });

    it('should return 400 for invalid file ID format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/files/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
    });

    it('should return 400 for upload without file', () => {
      return request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .field('ttl', '3600')
        .expect(400);
    });

    it('should return 400 for invalid TTL', () => {
      return request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test'), 'test.txt')
        .field('ttl', '30') // Слишком маленький TTL
        .expect(400);
    });

    it('should return 400 for invalid metadata JSON', () => {
      return request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test'), 'test.txt')
        .field('metadata', 'invalid json')
        .expect(400);
    });
  });

  describe('File Validation', () => {
    it('should accept valid file types', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(201);

      expect(response.body.file.originalName).toBe('test.txt');
      expect(response.body.file.mimeType).toBe('text/plain; charset=utf-8');
    });

    it('should handle custom filename', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test content'), 'original.txt')
        .field('customFilename', 'custom-name.txt')
        .expect(201);

      expect(response.body.file.originalName).toBe('original.txt');
      // Custom filename может использоваться для внутренней логики
    });

    it('should handle metadata correctly', async () => {
      const metadata = { description: 'Test file', category: 'test' };
      const response = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .field('metadata', JSON.stringify(metadata))
        .expect(201);

      expect(response.body.file.metadata).toEqual(metadata);
    });

    it('should handle allowDuplicate parameter', async () => {
      // Загружаем первый файл
      await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('same content'), 'test1.txt')
        .field('allowDuplicate', 'true')
        .expect(201);

      // Загружаем второй файл с тем же содержимым
      const response = await request(app.getHttpServer())
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('same content'), 'test2.txt')
        .field('allowDuplicate', 'true')
        .expect(201);

      expect(response.body.file.originalName).toBe('test2.txt');
    });
  });

  describe('Pagination and Filtering', () => {
    beforeEach(async () => {
      // Загружаем несколько файлов для тестирования пагинации
      const files = [
        { content: 'file1', name: 'file1.txt' },
        { content: 'file2', name: 'file2.txt' },
        { content: 'file3', name: 'file3.txt' },
      ];

      for (const file of files) {
        await request(app.getHttpServer())
          .post('/api/v1/files')
          .set('Authorization', `Bearer ${validToken}`)
          .attach('file', Buffer.from(file.content), file.name)
          .expect(201);
      }
    });

    it('should support pagination with limit and offset', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ limit: 2, offset: 0 })
        .expect(200);

      expect(response.body.files.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('hasPrev');
    });

    it('should support filtering by MIME type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ mimeType: 'text/plain; charset=utf-8' })
        .expect(200);

      expect(response.body.files.length).toBeGreaterThanOrEqual(0);
      // Все файлы должны быть текстовыми
      response.body.files.forEach((file: any) => {
        expect(file.mimeType).toBe('text/plain; charset=utf-8');
      });
    });

    it('should support filtering by file size', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ minSize: 1, maxSize: 10 })
        .expect(200);

      expect(response.body.files.length).toBeGreaterThanOrEqual(0);
      // Все файлы должны соответствовать размеру
      response.body.files.forEach((file: any) => {
        expect(file.size).toBeGreaterThanOrEqual(1);
        expect(file.size).toBeLessThanOrEqual(10);
      });
    });
  });
});
