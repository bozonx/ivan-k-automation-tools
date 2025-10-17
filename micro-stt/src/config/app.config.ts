import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  host: string;
  apiBasePath: string;
  apiVersion: string;
  nodeEnv: string;
  logLevel: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.LISTEN_PORT ?? '3000', 10),
    host: process.env.LISTEN_HOST ?? 'localhost',
    apiBasePath: (process.env.API_BASE_PATH ?? 'api').replace(/^\/+|\/+$/g, ''),
    apiVersion: (process.env.API_VERSION ?? 'v1').replace(/^\/+|\/+$/g, ''),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    logLevel: process.env.LOG_LEVEL ?? 'warn',
  }),
);
