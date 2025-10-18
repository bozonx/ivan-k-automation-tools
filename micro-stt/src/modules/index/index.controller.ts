import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AppConfig } from '@config/app.config';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Meta')
@Controller()
export class IndexController {
  private readonly version: string = this.readVersion();

  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'API index', description: 'Returns API metadata and useful links' })
  @ApiResponse({
    status: 200,
    description: 'Service index',
    schema: {
      example: {
        name: 'micro-stt',
        version: '0.12.2',
        status: 'ok',
        time: '2025-10-18T10:00:00.000Z',
        links: {
          self: '/api/v1',
          docs: '/api/docs',
          health: '/api/v1/health',
          transcriptions: '/api/v1/transcriptions',
        },
      },
    },
  })
  public index() {
    const appConfig = this.configService.get<AppConfig>('app')!;
    const base = `/${appConfig.apiBasePath}/${appConfig.apiVersion}`;
    return {
      name: 'micro-stt',
      version: this.version,
      status: 'ok',
      time: new Date().toISOString(),
      links: {
        self: base,
        docs: '/api/docs',
        health: `${base}/health`,
        transcriptions: `${base}/transcriptions`,
      },
    } as const;
  }

  private readVersion(): string {
    const candidates = [
      path.resolve(process.cwd(), 'package.json'),
      path.resolve(__dirname, '..', '..', '..', 'package.json'),
    ];
    for (const pkgPath of candidates) {
      try {
        const raw = fs.readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw) as { version?: string };
        if (typeof pkg.version === 'string' && pkg.version.length > 0) {
          return pkg.version;
        }
      } catch (_err) {
        // continue
      }
    }
    return '0.0.0';
  }
}
