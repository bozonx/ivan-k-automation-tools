import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    const userAgent = request.headers['user-agent'] || 'unknown';
    const ip = request.ip || request.connection.remoteAddress || 'unknown';

    this.logger.log(`➡️  ${method} ${url} - IP: ${ip}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          const statusCode = response.statusCode;

          // Use different log levels based on status code
          if (statusCode >= 500) {
            this.logger.error(`⬅️  ${method} ${url} ${statusCode} - ${delay}ms`);
          } else if (statusCode >= 400) {
            this.logger.warn(`⬅️  ${method} ${url} ${statusCode} - ${delay}ms`);
          } else {
            this.logger.log(`⬅️  ${method} ${url} ${statusCode} - ${delay}ms`);
          }
        },
        error: (error: Error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `⬅️  ${method} ${url} ERROR - ${delay}ms - ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
