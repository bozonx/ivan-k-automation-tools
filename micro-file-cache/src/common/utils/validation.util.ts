import { FileInfo, UploadedFile } from '../interfaces/file.interface';

/**
 * Утилиты для валидации данных
 */
export class ValidationUtil {
  /**
   * Максимальный размер файла в байтах (100MB)
   */
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024;

  /**
   * Минимальное время жизни файла в секундах (1 минута)
   */
  private static readonly MIN_TTL = 60;

  /**
   * Максимальное время жизни файла в секундах (30 дней)
   */
  private static readonly MAX_TTL = 30 * 24 * 60 * 60;

  /**
   * Разрешенные MIME типы
   */
  private static readonly ALLOWED_MIME_TYPES = [
    // Изображения
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',

    // Документы
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',

    // Архивы
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-tar',

    // Аудио
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',

    // Видео
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/ogg',

    // JSON и XML
    'application/json',
    'application/xml',
    'text/xml',

    // Бинарные файлы (для тестов и общих случаев)
    'application/octet-stream',
  ];

  /**
   * Валидирует загруженный файл
   * @param file - загруженный файл
   * @returns объект с результатом валидации
   */
  static validateUploadedFile(file: UploadedFile): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Проверяем наличие файла
    if (!file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    // Проверяем имя файла (обязательное поле)
    if (
      !file.originalname ||
      typeof file.originalname !== 'string' ||
      file.originalname.trim() === ''
    ) {
      errors.push('Original filename is required');
    }

    // Проверяем размер файла (должен быть положительным числом)
    if (typeof file.size !== 'number' || file.size <= 0) {
      errors.push('File size must be a positive number');
    } else if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE} bytes`);
    }

    // Проверяем MIME тип (обязательное поле)
    if (!file.mimetype || typeof file.mimetype !== 'string' || file.mimetype.trim() === '') {
      errors.push('MIME type is required');
    } else if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      errors.push(`MIME type '${file.mimetype}' is not allowed`);
    }

    // Проверяем наличие пути к файлу или буфера
    if (!file.path && !file.buffer) {
      errors.push('File must have either path or buffer');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Валидирует TTL (время жизни файла)
   * @param ttl - время жизни в секундах
   * @returns объект с результатом валидации
   */
  static validateTTL(ttl: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (typeof ttl !== 'number') {
      errors.push('TTL must be a number');
    } else if (!Number.isInteger(ttl)) {
      errors.push('TTL must be an integer');
    } else if (ttl < this.MIN_TTL) {
      errors.push(`TTL must be at least ${this.MIN_TTL} seconds`);
    } else if (ttl > this.MAX_TTL) {
      errors.push(`TTL must not exceed ${this.MAX_TTL} seconds`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Валидирует ID файла
   * @param id - идентификатор файла
   * @returns объект с результатом валидации
   */
  static validateFileId(id: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!id || typeof id !== 'string') {
      errors.push('File ID is required and must be a string');
    } else if (id.trim().length === 0) {
      errors.push('File ID cannot be empty');
    } else if (id.length > 255) {
      errors.push('File ID is too long');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      errors.push('File ID must contain only alphanumeric characters, hyphens, and underscores');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Валидирует метаданные файла
   * @param metadata - метаданные файла
   * @returns объект с результатом валидации
   */
  static validateMetadata(metadata: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (metadata === null || metadata === undefined) {
      return { isValid: true, errors: [] };
    }

    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      errors.push('Metadata must be an object');
      return { isValid: false, errors };
    }

    // Проверяем количество ключей
    const keys = Object.keys(metadata);
    if (keys.length > 50) {
      errors.push('Metadata cannot have more than 50 keys');
    }

    // Проверяем ключи и значения
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof key !== 'string' || key.length === 0) {
        errors.push('Metadata keys must be non-empty strings');
        continue;
      }

      if (key.length > 100) {
        errors.push(`Metadata key '${key}' is too long`);
      }

      // Проверяем тип значения
      if (
        value !== null &&
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean' &&
        !Array.isArray(value)
      ) {
        errors.push(`Metadata value for key '${key}' must be a string, number, boolean, or null`);
      }

      // Если это массив, проверяем что все элементы - строки
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string') {
            errors.push(`Metadata array value for key '${key}' at index ${i} must be a string`);
          }
        }
      }

      // Проверяем размер значения
      if (typeof value === 'string' && value.length > 1000) {
        errors.push(`Metadata value for key '${key}' is too long`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Валидирует полную информацию о файле
   * @param fileInfo - информация о файле
   * @returns объект с результатом валидации
   */
  static validateFileInfo(fileInfo: FileInfo): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!fileInfo || typeof fileInfo !== 'object') {
      errors.push('File info is required and must be an object');
      return { isValid: false, errors };
    }

    // Валидируем обязательные поля
    const idValidation = this.validateFileId(fileInfo.id);
    if (!idValidation.isValid) {
      errors.push(...idValidation.errors);
    }

    if (!fileInfo.originalName || typeof fileInfo.originalName !== 'string') {
      errors.push('Original name is required');
    }

    if (!fileInfo.storedName || typeof fileInfo.storedName !== 'string') {
      errors.push('Stored name is required');
    }

    if (!fileInfo.mimeType || typeof fileInfo.mimeType !== 'string') {
      errors.push('MIME type is required');
    }

    if (typeof fileInfo.size !== 'number' || fileInfo.size <= 0) {
      errors.push('Size must be a positive number');
    }

    if (!fileInfo.hash || typeof fileInfo.hash !== 'string') {
      errors.push('Hash is required');
    }

    if (!(fileInfo.uploadedAt instanceof Date)) {
      errors.push('Uploaded at must be a Date object');
    }

    if (typeof fileInfo.ttl !== 'number' || fileInfo.ttl <= 0) {
      errors.push('TTL must be a positive number');
    }

    if (!(fileInfo.expiresAt instanceof Date)) {
      errors.push('Expires at must be a Date object');
    }

    if (!fileInfo.filePath || typeof fileInfo.filePath !== 'string') {
      errors.push('File path is required');
    }

    // Валидируем метаданные если они есть
    if (fileInfo.metadata) {
      const metadataValidation = this.validateMetadata(fileInfo.metadata);
      if (!metadataValidation.isValid) {
        errors.push(...metadataValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Проверяет, является ли строка валидным UUID
   * @param uuid - строка для проверки
   * @returns true если строка является валидным UUID
   */
  static isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Проверяет, является ли строка валидным email
   * @param email - строка для проверки
   * @returns true если строка является валидным email
   */
  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Проверяет, является ли строка валидным URL
   * @param url - строка для проверки
   * @returns true если строка является валидным URL
   */
  static isValidURL(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
