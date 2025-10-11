import { extname, basename, dirname } from 'path';
import { HashUtil } from './hash.util';

/**
 * Утилиты для работы с именами файлов
 */
export class FilenameUtil {
  /**
   * Максимальная длина имени файла
   */
  private static readonly MAX_FILENAME_LENGTH = 255;

  /**
   * Запрещенные символы в именах файлов (для замены)
   */
  private static readonly FORBIDDEN_CHARS_REPLACE = /[<>:"/\\|?*\x00-\x1f]/g;

  /**
   * Запрещенные символы в именах файлов (для проверки)
   */
  private static readonly FORBIDDEN_CHARS_TEST = /[<>:"/\\|?*\x00-\x1f]/;

  /**
   * Генерирует безопасное имя файла для хранения
   * @param originalName - оригинальное имя файла
   * @param hash - хеш файла для уникальности
   * @returns безопасное имя файла
   */
  static generateSafeFilename(originalName: string, hash: string): string {
    if (!originalName || typeof originalName !== 'string' || originalName.trim() === '') {
      throw new Error('Original filename must be a non-empty string');
    }

    if (!HashUtil.isValidHash(hash)) {
      throw new Error('Hash must be a valid SHA-256 hash');
    }

    // Получаем расширение файла
    const extension = this.getFileExtension(originalName);

    // Очищаем имя файла от запрещенных символов
    const cleanName = this.sanitizeFilename(originalName);

    // Создаем уникальное имя: cleanName_hash.ext
    const shortHash = hash.substring(0, 8);
    const baseName = this.removeExtension(cleanName);

    let safeFilename = `${baseName}_${shortHash}${extension}`;

    // Проверяем длину и обрезаем если необходимо
    if (safeFilename.length > this.MAX_FILENAME_LENGTH) {
      const maxBaseLength = this.MAX_FILENAME_LENGTH - shortHash.length - extension.length - 1; // -1 для подчеркивания
      const truncatedBase = baseName.substring(0, maxBaseLength);
      safeFilename = `${truncatedBase}_${shortHash}${extension}`;
    }

    return safeFilename;
  }

  /**
   * Извлекает расширение файла
   * @param filename - имя файла
   * @returns расширение файла (включая точку)
   */
  static getFileExtension(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return '';
    }

    const extension = extname(filename);
    return extension.toLowerCase();
  }

  /**
   * Удаляет расширение из имени файла
   * @param filename - имя файла
   * @returns имя файла без расширения
   */
  static removeExtension(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return '';
    }

    const baseName = basename(filename, extname(filename));
    return baseName;
  }

  /**
   * Очищает имя файла от запрещенных символов
   * @param filename - имя файла для очистки
   * @returns очищенное имя файла
   */
  static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return '';
    }

    // Заменяем запрещенные символы на подчеркивания
    let sanitized = filename.replace(this.FORBIDDEN_CHARS_REPLACE, '_');

    // Удаляем множественные подчеркивания
    sanitized = sanitized.replace(/_+/g, '_');

    // Удаляем подчеркивания в начале и конце
    sanitized = sanitized.replace(/^_+|_+$/g, '');

    // Если имя стало пустым, используем "file"
    if (!sanitized) {
      sanitized = 'file';
    }

    // Ограничиваем длину имени файла (оставляем место для хеша и расширения)
    const maxLength = 200; // Оставляем место для хеша (8 символов) + подчеркивание + расширение
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Проверяет, является ли имя файла безопасным
   * @param filename - имя файла для проверки
   * @returns true если имя файла безопасно
   */
  static isSafeFilename(filename: string): boolean {
    if (!filename || typeof filename !== 'string') {
      return false;
    }

    // Проверяем длину
    if (filename.length > this.MAX_FILENAME_LENGTH) {
      return false;
    }

    // Проверяем наличие запрещенных символов
    if (this.FORBIDDEN_CHARS_TEST.test(filename)) {
      return false;
    }

    // Проверяем, что имя не пустое
    if (filename.trim().length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Генерирует путь к файлу в формате YYYY-MM
   * @param date - дата для генерации пути
   * @returns путь в формате YYYY-MM
   */
  static generateDatePath(date: Date = new Date()): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
  }

  /**
   * Создает полный путь к файлу
   * @param basePath - базовый путь
   * @param datePath - путь по дате (YYYY-MM)
   * @param filename - имя файла
   * @returns полный путь к файлу
   */
  static createFilePath(basePath: string, datePath: string, filename: string): string {
    if (!basePath || !datePath || !filename) {
      throw new Error('All path components must be provided');
    }

    // Нормализуем пути
    const normalizedBase = basePath.replace(/\/+$/, ''); // убираем trailing slashes
    const normalizedDate = datePath.replace(/^\/+|\/+$/g, ''); // убираем leading/trailing slashes
    const normalizedFilename = filename.replace(/^\/+/, ''); // убираем leading slashes

    return `${normalizedBase}/${normalizedDate}/${normalizedFilename}`;
  }

  /**
   * Извлекает информацию о файле из пути
   * @param filePath - полный путь к файлу
   * @returns объект с информацией о файле
   */
  static parseFilePath(filePath: string): {
    directory: string;
    filename: string;
    basename: string;
    extension: string;
  } {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path must be a non-empty string');
    }

    const directory = dirname(filePath);
    const filename = basename(filePath);
    const extension = this.getFileExtension(filename);
    const basenameWithoutExt = this.removeExtension(filename);

    return {
      directory,
      filename,
      basename: basenameWithoutExt,
      extension,
    };
  }

  /**
   * Проверяет, является ли расширение файла разрешенным
   * @param filename - имя файла
   * @param allowedExtensions - массив разрешенных расширений (без точки)
   * @returns true если расширение разрешено
   */
  static isAllowedExtension(filename: string, allowedExtensions: string[]): boolean {
    if (!filename || !Array.isArray(allowedExtensions)) {
      return false;
    }

    const extension = this.getFileExtension(filename).toLowerCase();
    const normalizedAllowed = allowedExtensions.map((ext) =>
      ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`,
    );

    return normalizedAllowed.includes(extension);
  }
}
