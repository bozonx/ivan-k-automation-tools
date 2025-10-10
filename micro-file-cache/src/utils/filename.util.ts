import { v4 as uuidv4 } from 'uuid';

/**
 * Максимальная длина короткого имени файла
 */
const MAX_SHORT_FILENAME_LENGTH = 30;

/**
 * Санитизирует имя файла, заменяя неправильные символы на подчеркивания
 * @param filename - оригинальное имя файла
 * @returns санитизированное имя файла
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Заменяем все неправильные символы на _
    .replace(/_{2,}/g, '_') // Заменяем множественные подчеркивания на одно
    .replace(/^_+|_+$/g, ''); // Убираем подчеркивания в начале и конце
}

/**
 * Создает короткое имя файла (обрезает до 30 символов)
 * @param filename - оригинальное имя файла
 * @returns короткое имя файла
 */
export function createShortFilename(filename: string): string {
  const sanitized = sanitizeFilename(filename);

  if (sanitized.length <= MAX_SHORT_FILENAME_LENGTH) {
    return sanitized;
  }

  // Обрезаем до максимальной длины, сохраняя расширение если возможно
  const lastDotIndex = sanitized.lastIndexOf('.');

  if (lastDotIndex > 0 && lastDotIndex < sanitized.length - 1) {
    const nameWithoutExt = sanitized.substring(0, lastDotIndex);
    const extension = sanitized.substring(lastDotIndex);

    if (extension.length < MAX_SHORT_FILENAME_LENGTH) {
      const maxNameLength = MAX_SHORT_FILENAME_LENGTH - extension.length;
      const truncatedName = nameWithoutExt.substring(0, maxNameLength);
      return truncatedName + extension;
    }
  }

  // Если расширение слишком длинное или его нет, просто обрезаем
  return sanitized.substring(0, MAX_SHORT_FILENAME_LENGTH);
}

/**
 * Создает полное имя файла в новом формате: <SHORT_FILENAME>-<UUID>.<EXT>
 * @param originalFilename - оригинальное имя файла
 * @returns новое имя файла с UUID
 */
export function createStorageFilename(originalFilename: string): string {
  const shortName = createShortFilename(originalFilename);
  const uuid = uuidv4();

  // Извлекаем расширение из оригинального имени
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const extension = lastDotIndex > 0 ? originalFilename.substring(lastDotIndex) : '';

  // Если короткое имя уже содержит расширение, используем его
  if (shortName.includes('.')) {
    const shortNameWithoutExt = shortName.substring(0, shortName.lastIndexOf('.'));
    return `${shortNameWithoutExt}-${uuid}${extension}`;
  }

  return `${shortName}-${uuid}${extension}`;
}

/**
 * Создает путь к директории для хранения файла в формате: <YEAR>-<MONTH>
 * @param date - дата создания файла (по умолчанию текущая дата)
 * @returns путь к директории
 */
export function createStorageDirectoryPath(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}
