import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { TranscriptionModule } from '@modules/transcription/transcription.module';
import { HealthModule } from '@modules/health/health.module';
import { IndexModule } from '@modules/index/index.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import appConfig from '@config/app.config';
import sttConfig from '@config/stt.config';
import type { AppConfig } from '@config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, sttConfig],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      cache: true,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get<AppConfig>('app')!;
        const isDev = appConfig.nodeEnv === 'development';

        return {
          pinoHttp: {
            level: appConfig.logLevel,
            // Use pino-pretty for development, JSON for production
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'pid,hostname',
                    messageFormat: '{req.method} {req.url} {msg}',
                  },
                }
              : undefined,
            // Custom serializers for better log structure
            serializers: {
              req: req => ({
                id: req.id,
                method: req.method,
                url: req.url,
                // Remove query params from URL in logs for security
                path: req.url?.split('?')[0],
                remoteAddress: req.ip,
                remotePort: req.socket?.remotePort,
              }),
              res: res => ({
                statusCode: res.statusCode,
              }),
              err: err => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
              }),
            },
            // Redact sensitive information
            redact: {
              paths: ['req.headers.authorization', 'req.headers["x-api-key"]'],
              censor: '[REDACTED]',
            },
            // Custom log level based on response status
            customLogLevel: (req, res, err) => {
              if (res.statusCode >= 500 || err) {
                return 'error';
              }
              if (res.statusCode >= 400) {
                return 'warn';
              }
              if (res.statusCode >= 300) {
                return 'info';
              }
              return 'info';
            },
            // Don't log health check endpoints in production to reduce noise
            autoLogging: {
              ignore: req => {
                if (appConfig.nodeEnv === 'production') {
                  return req.url?.includes('/health') || false;
                }
                return false;
              },
            },
          },
        };
      },
    }),
    TranscriptionModule,
    HealthModule,
    IndexModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
