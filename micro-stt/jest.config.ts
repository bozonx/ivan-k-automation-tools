import type { Config } from 'jest';

// Common module name mapper for path aliases
const moduleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@common/(.*)$': '<rootDir>/src/common/$1',
  '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  '^@config/(.*)$': '<rootDir>/src/config/$1',
  '^@providers/(.*)$': '<rootDir>/src/providers/$1',
  '^@test/(.*)$': '<rootDir>/test/$1',
};

// Common module file extensions
const moduleFileExtensions = ['ts', 'js', 'json'];

// Common transform configuration
const transform = {
  '^.+\\.ts$': [
    'ts-jest',
    {
      tsconfig: 'tsconfig.spec.json',
    },
  ],
};

const config: Config = {
  projects: [
    // Unit tests configuration
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions,
      rootDir: '.',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts', '<rootDir>/src/**/*.spec.ts'],
      testPathIgnorePatterns: ['<rootDir>/test/e2e/', '<rootDir>/dist/'],
      setupFilesAfterEnv: ['<rootDir>/test/setup/unit.setup.ts'],
      collectCoverageFrom: ['src/**/*.(t|j)s'],
      coverageDirectory: 'coverage',
      coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/', '.module.ts$', 'main.ts$'],
      transform,
      moduleNameMapper,
      // Global timeout for unit tests (default: 5 seconds)
      testTimeout: 5000,
    },
    // E2E tests configuration
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleFileExtensions,
      rootDir: '.',
      testRegex: '.*\\.e2e-spec\\.ts$',
      setupFilesAfterEnv: ['<rootDir>/test/setup/e2e.setup.ts'],
      collectCoverageFrom: ['src/**/*.(t|j)s'],
      coverageDirectory: 'coverage',
      coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/', '.module.ts$', 'main.ts$'],
      transform,
      moduleNameMapper,
      // Global timeout for e2e tests (default: 30 seconds)
      testTimeout: 30000,
    },
  ],
};

export default config;
