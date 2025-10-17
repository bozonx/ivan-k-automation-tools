import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    const mockRequest = {
      method: 'POST',
      url: '/api/v1/transcriptions/file',
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };

    const mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn(),
    } as unknown as CallHandler;
  });

  describe('intercept', () => {
    it('should log incoming request', done => {
      const logSpy = jest.spyOn((interceptor as any).logger, 'log');

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test-response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('➡️  POST /api/v1/transcriptions/file'),
          );
          done();
        },
      });
    });

    it('should log successful response with 2xx status', done => {
      const logSpy = jest.spyOn((interceptor as any).logger, 'log');

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test-response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('⬅️  POST /api/v1/transcriptions/file 200'),
          );
          done();
        },
      });
    });

    it('should log warning for 4xx status codes', done => {
      const warnSpy = jest.spyOn((interceptor as any).logger, 'warn');
      const mockResponse = { statusCode: 400 };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'POST',
            url: '/api/v1/transcriptions/file',
            headers: { 'user-agent': 'test-agent' },
            ip: '127.0.0.1',
          }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test-response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('⬅️  POST /api/v1/transcriptions/file 400'),
          );
          done();
        },
      });
    });

    it('should log error for 5xx status codes', done => {
      const errorSpy = jest.spyOn((interceptor as any).logger, 'error');
      const mockResponse = { statusCode: 500 };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'POST',
            url: '/api/v1/transcriptions/file',
            headers: { 'user-agent': 'test-agent' },
            ip: '127.0.0.1',
          }),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test-response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('⬅️  POST /api/v1/transcriptions/file 500'),
          );
          done();
        },
      });
    });

    it('should log error when exception is thrown', done => {
      const errorSpy = jest.spyOn((interceptor as any).logger, 'error');
      const testError = new Error('Test error');

      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(() => testError));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('⬅️  POST /api/v1/transcriptions/file ERROR'),
            expect.any(String),
          );
          done();
        },
      });
    });

    it('should measure and log request duration', done => {
      const logSpy = jest.spyOn((interceptor as any).logger, 'log');

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test-response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ms'));
          done();
        },
      });
    });

    it('should handle requests without user-agent header', done => {
      const mockRequest = {
        method: 'GET',
        url: '/heartbeat',
        headers: {},
        ip: '192.168.1.1',
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
        }),
      } as unknown as ExecutionContext;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('ok'));

      const logSpy = jest.spyOn((interceptor as any).logger, 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
