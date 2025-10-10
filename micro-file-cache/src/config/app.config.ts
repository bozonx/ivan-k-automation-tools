/**
 * Конфигурация приложения
 */

/**
 * Основная конфигурация приложения
 */
export interface AppConfig {
  /** Настройки сервера */
  server: ServerConfig;

  /** Настройки хранилища */
  storage: StorageConfig;

  /** Настройки аутентификации */
  auth: AuthConfig;

  /** Настройки очистки */
  cleanup: CleanupConfig;

  /** Настройки логирования */
  logging: LoggingConfig;

  /** Настройки CORS */
  cors: CorsConfig;
}

/**
 * Конфигурация сервера
 */
export interface ServerConfig {
  /** Порт для прослушивания */
  port: number;

  /** Хост для прослушивания */
  host: string;

  /** Префикс для API */
  apiPrefix: string;

  /** Версия API */
  apiVersion: string;

  /** Включить Swagger документацию */
  enableSwagger: boolean;

  /** Включить глобальную валидацию */
  enableGlobalValidation: boolean;
}

/**
 * Конфигурация хранилища
 */
export interface StorageConfig {
  /** Базовый путь к директории хранилища */
  basePath: string;

  /** Максимальный размер файла в байтах */
  maxFileSize: number;

  /** Разрешенные MIME типы */
  allowedMimeTypes: string[];

  /** Формат организации файлов по датам */
  dateFormat: string;

  /** Включить дедупликацию файлов */
  enableDeduplication: boolean;

  /** Максимальное время жизни файла в секундах */
  maxTtl: number;

  /** Минимальное время жизни файла в секундах */
  minTtl: number;

  /** Время жизни по умолчанию в секундах */
  defaultTtl: number;
}

/**
 * Конфигурация аутентификации
 */
export interface AuthConfig {
  /** Включить аутентификацию */
  enabled: boolean;

  /** Секретный ключ для JWT токенов */
  secretKey: string;

  /** Время жизни токена в секундах */
  tokenExpiration: number;

  /** Алгоритм подписи токена */
  algorithm: string;

  /** Исключения из аутентификации (пути) */
  excludePaths: string[];
}

/**
 * Конфигурация очистки
 */
export interface CleanupConfig {
  /** Включить автоматическую очистку */
  enabled: boolean;

  /** Cron выражение для расписания очистки */
  cronExpression: string;

  /** Интервал проверки в миллисекундах */
  checkInterval: number;

  /** Включить логирование операций очистки */
  enableLogging: boolean;

  /** Максимальное количество файлов для удаления за раз */
  maxFilesPerBatch: number;
}

/**
 * Конфигурация логирования
 */
export interface LoggingConfig {
  /** Уровень логирования */
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose';

  /** Включить логирование в файл */
  enableFileLogging: boolean;

  /** Путь к файлу логов */
  logFilePath: string;

  /** Максимальный размер файла лога в байтах */
  maxLogFileSize: number;

  /** Максимальное количество файлов логов */
  maxLogFiles: number;

  /** Включить логирование запросов */
  enableRequestLogging: boolean;

  /** Включить логирование ошибок */
  enableErrorLogging: boolean;
}

/**
 * Конфигурация CORS
 */
export interface CorsConfig {
  /** Включить CORS */
  enabled: boolean;

  /** Разрешенные источники */
  origin: string | string[] | boolean;

  /** Разрешить учетные данные */
  credentials: boolean;

  /** Разрешенные методы */
  methods: string[];

  /** Разрешенные заголовки */
  allowedHeaders: string[];

  /** Заголовки для экспозиции */
  exposedHeaders: string[];

  /** Максимальный возраст preflight запроса */
  maxAge: number;
}

/**
 * Конфигурация по умолчанию
 */
export const defaultConfig: AppConfig = {
  server: {
    port: parseInt(process.env.LISTEN_PORT || '3000', 10),
    host: process.env.LISTEN_HOST || 'localhost',
    apiPrefix: '/api',
    apiVersion: 'v1',
    enableSwagger: process.env.NODE_ENV !== 'production',
    enableGlobalValidation: true,
  },

  storage: {
    basePath: process.env.STORAGE_PATH || './storage',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
    ],
    dateFormat: 'YYYY-MM',
    enableDeduplication: true,
    maxTtl: parseInt(process.env.MAX_TTL || '86400', 10), // 24 часа
    minTtl: parseInt(process.env.MIN_TTL || '60', 10), // 1 минута
    defaultTtl: parseInt(process.env.DEFAULT_TTL || '3600', 10), // 1 час
  },

  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    secretKey: process.env.AUTH_SECRET_KEY || 'your-secret-key-change-in-production',
    tokenExpiration: parseInt(process.env.AUTH_TOKEN_EXPIRATION || '3600', 10), // 1 час
    algorithm: 'HS256',
    excludePaths: ['/api/v1/health'],
  },

  cleanup: {
    enabled: process.env.CLEANUP_ENABLED !== 'false',
    cronExpression: process.env.CLEANUP_CRON || '0 * * * * *', // каждую минуту
    checkInterval: parseInt(process.env.CLEANUP_INTERVAL || '60000', 10), // 1 минута
    enableLogging: true,
    maxFilesPerBatch: parseInt(process.env.CLEANUP_BATCH_SIZE || '100', 10),
  },

  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    enableFileLogging: process.env.NODE_ENV === 'production',
    logFilePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxLogFileSize: parseInt(process.env.MAX_LOG_FILE_SIZE || '10485760', 10), // 10MB
    maxLogFiles: parseInt(process.env.MAX_LOG_FILES || '5', 10),
    enableRequestLogging: true,
    enableErrorLogging: true,
  },

  cors: {
    enabled: true,
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 часа
  },
};

/**
 * Валидация конфигурации
 */
export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];

  // Валидация сервера
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Server port must be between 1 and 65535');
  }

  if (!config.server.host || config.server.host.trim() === '') {
    errors.push('Server host cannot be empty');
  }

  // Валидация хранилища
  if (config.storage.maxFileSize < 1) {
    errors.push('Max file size must be greater than 0');
  }

  if (config.storage.maxTtl < config.storage.minTtl) {
    errors.push('Max TTL must be greater than or equal to min TTL');
  }

  if (
    config.storage.defaultTtl < config.storage.minTtl ||
    config.storage.defaultTtl > config.storage.maxTtl
  ) {
    errors.push('Default TTL must be between min and max TTL');
  }

  // Валидация аутентификации
  if (config.auth.enabled && (!config.auth.secretKey || config.auth.secretKey.length < 32)) {
    errors.push('Auth secret key must be at least 32 characters long when auth is enabled');
  }

  if (config.auth.tokenExpiration < 60) {
    errors.push('Token expiration must be at least 60 seconds');
  }

  // Валидация очистки
  if (config.cleanup.maxFilesPerBatch < 1) {
    errors.push('Max files per batch must be greater than 0');
  }

  return errors;
}

/**
 * Получение конфигурации с валидацией
 */
export function getConfig(): AppConfig {
  const config = defaultConfig;
  const errors = validateConfig(config);

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }

  return config;
}
