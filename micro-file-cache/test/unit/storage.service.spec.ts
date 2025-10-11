/**
 * Unit тесты для StorageService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../src/modules/storage/storage.service';
import * as fs from 'fs-extra';
import * as path from 'path';

// Мокаем file-type для тестов
jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest.fn().mockResolvedValue({
    mime: 'text/plain',
    ext: 'txt',
  }),
}));

// Мокаем dayjs для тестов
jest.mock('dayjs', () => {
  const mockDayjs = jest.fn(() => ({
    format: jest.fn(() => '2024-01'),
    add: jest.fn(() => mockDayjs()),
    isAfter: jest.fn(() => false),
    valueOf: jest.fn(() => 1640995200000),
    toDate: jest.fn(() => new Date('2024-01-01T00:00:00.000Z')),
  }));
  return mockDayjs;
});

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;
  let testStoragePath: string;

  beforeEach(async () => {
    // Создаем временную директорию для тестов
    testStoragePath = path.join(__dirname, '..', '..', 'temp-test-storage');
    await fs.ensureDir(testStoragePath);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                STORAGE_BASE_PATH: testStoragePath,
                MAX_FILE_SIZE: 1024 * 1024, // 1MB
                ALLOWED_MIME_TYPES: [], // Разрешены все типы файлов
                DATE_FORMAT: 'YYYY-MM',
                ENABLE_DEDUPLICATION: true,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    // Очищаем временную директорию после каждого теста
    if (await fs.pathExists(testStoragePath)) {
      await fs.remove(testStoragePath);
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize storage directory and metadata file', async () => {
    // Проверяем, что директория создана
    expect(await fs.pathExists(testStoragePath)).toBe(true);

    // Вызываем метод, который инициализирует метаданные
    await service.getFileStats();

    // Проверяем, что файл метаданных создан
    const metadataPath = path.join(testStoragePath, 'data.json');
    expect(await fs.pathExists(metadataPath)).toBe(true);

    // Проверяем содержимое метаданных
    const metadata = await fs.readJson(metadataPath);
    expect(metadata).toHaveProperty('version');
    expect(metadata).toHaveProperty('totalFiles', 0);
    expect(metadata).toHaveProperty('totalSize', 0);
    expect(metadata).toHaveProperty('files');
  });

  it('should get storage health', async () => {
    const health = await service.getStorageHealth();

    expect(health).toBeDefined();
    expect(health.isAvailable).toBe(true);
    expect(health.fileCount).toBe(0);
    expect(health.lastChecked).toBeInstanceOf(Date);
  });

  it('should get file stats', async () => {
    const stats = await service.getFileStats();

    expect(stats).toBeDefined();
    expect(stats.totalFiles).toBe(0);
    expect(stats.totalSize).toBe(0);
    expect(stats.filesByMimeType).toEqual({});
    expect(stats.filesByDate).toEqual({});
  });

  it('should search files with empty result', async () => {
    const result = await service.searchFiles({});

    expect(result).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.params).toEqual({});
  });

  it('should handle file not found', async () => {
    const result = await service.getFileInfo('non-existent-id');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should handle delete non-existent file', async () => {
    const result = await service.deleteFile('non-existent-id');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should have empty allowedMimeTypes by default (allowing all types)', () => {
    // Проверяем, что по умолчанию разрешены все типы файлов
    expect(service['config'].allowedMimeTypes).toEqual([]);
  });
});
