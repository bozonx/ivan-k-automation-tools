/// <reference types="jest" />
import {
  sanitizeFilename,
  createShortFilename,
  createStorageFilename,
  createStorageDirectoryPath,
} from '../../src/utils/filename.util';

describe('Utils Filename Functions', () => {
  describe('sanitizeFilename', () => {
    it('should replace forbidden characters and spaces with underscores', () => {
      const filename = 'test<file>:"name with spaces".txt';
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).toBe('test_file_name_with_spaces_.txt');
    });

    it('should remove multiple consecutive underscores', () => {
      const filename = 'test___file____name.txt';
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).toBe('test_file_name.txt');
    });

    it('should remove leading and trailing underscores', () => {
      const filename = '_test_file_';
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).toBe('test_file');
    });

    it('should handle empty input', () => {
      expect(sanitizeFilename('')).toBe('');
    });
  });

  describe('createShortFilename', () => {
    it('should create short filename without extension (20 chars max)', () => {
      const filename = 'very-long-filename-that-exceeds-limit.txt';
      const shortName = createShortFilename(filename);

      expect(shortName).toBe('very-long-filename-t');
      expect(shortName.length).toBe(20);
      expect(shortName).not.toContain('.txt');
    });

    it('should return original name if under 20 characters', () => {
      const filename = 'short.txt';
      const shortName = createShortFilename(filename);

      expect(shortName).toBe('short');
    });

    it('should handle filename without extension', () => {
      const filename = 'filename-without-extension';
      const shortName = createShortFilename(filename);

      expect(shortName).toBe('filename-without-ext');
      expect(shortName.length).toBe(20);
    });

    it('should sanitize filename before shortening', () => {
      const filename = 'test file with spaces.txt';
      const shortName = createShortFilename(filename);

      expect(shortName).toBe('test_file_with_space');
      expect(shortName).not.toContain(' ');
    });
  });

  describe('createStorageFilename', () => {
    it('should create filename in format: shortname_uuid.ext', () => {
      const filename = 'test-file.txt';
      const storageName = createStorageFilename(filename);

      expect(storageName).toMatch(/^test-file_[a-f0-9]{8}\.txt$/);
    });

    it('should handle long filenames by truncating to 20 chars', () => {
      const filename = 'very-long-filename-that-exceeds-limit.txt';
      const storageName = createStorageFilename(filename);

      expect(storageName).toMatch(/^very-long-filename-t_[a-f0-9]{8}\.txt$/);
    });

    it('should handle files without extension', () => {
      const filename = 'testfile';
      const storageName = createStorageFilename(filename);

      expect(storageName).toMatch(/^testfile_[a-f0-9]{8}$/);
    });

    it('should sanitize filename before creating storage name', () => {
      const filename = 'test file with spaces.txt';
      const storageName = createStorageFilename(filename);

      expect(storageName).toMatch(/^test_file_with_space_[a-f0-9]{8}\.txt$/);
    });

    it('should generate unique names for same input', () => {
      const filename = 'test.txt';
      const name1 = createStorageFilename(filename);
      const name2 = createStorageFilename(filename);

      expect(name1).not.toBe(name2);
      expect(name1).toMatch(/^test_[a-f0-9]{8}\.txt$/);
      expect(name2).toMatch(/^test_[a-f0-9]{8}\.txt$/);
    });
  });

  describe('createStorageDirectoryPath', () => {
    it('should create directory path in YYYY-MM format', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      const path = createStorageDirectoryPath(date);

      expect(path).toBe('2024-03');
    });

    it('should use current date if no date provided', () => {
      const path = createStorageDirectoryPath();
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      expect(path).toBe(expected);
    });

    it('should handle single digit months', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const path = createStorageDirectoryPath(date);

      expect(path).toBe('2024-01');
    });
  });
});
