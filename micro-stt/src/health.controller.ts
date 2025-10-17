import { Controller, Get, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly serviceStartMs = Date.now();
  private readonly version: string = this.readVersion();

  @Get('heartbeat')
  public heartbeat() {
    const uptime = Date.now() - this.serviceStartMs;
    this.logger.debug(`Health check requested. Uptime: ${uptime}ms`);
    return { status: 'ok', uptime, version: this.version };
  }

  private readVersion(): string {
    // Resolve package.json from project root to be robust when running from dist/
    const candidates = [
      path.resolve(process.cwd(), 'package.json'),
      path.resolve(__dirname, '..', '..', 'package.json'),
    ];
    for (const pkgPath of candidates) {
      try {
        const raw = fs.readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw) as { version?: string };
        if (typeof pkg.version === 'string' && pkg.version.length > 0) {
          return pkg.version;
        }
      } catch (_err) {
        // continue to next candidate
      }
    }
    return '0.0.0';
  }
}
