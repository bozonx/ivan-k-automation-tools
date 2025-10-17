import { Test, type TestingModule } from '@nestjs/testing';
import { HealthController } from '../../src/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get<HealthController>(HealthController);
  });

  it('returns ok, uptime, and version on GET /heartbeat', () => {
    const res = controller.heartbeat();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(res.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof res.version).toBe('string');
    expect(res.version.length).toBeGreaterThan(0);
  });
});
