import { Inject, Injectable } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { HealthService } from "../health/health.service.js";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import { MetricsRegistry } from "./metrics-registry.js";
import { MonitoringRepository } from "./monitoring.repository.js";
import type { MonitoringSnapshot } from "./monitoring.types.js";

@Injectable()
export class MonitoringService {
  constructor(
    @Inject(SERVICE_ENVIRONMENT)
    private readonly environment: ServiceEnvironment,
    @Inject(HealthService) private readonly healthService: HealthService,
    @Inject(MetricsRegistry) private readonly registry: MetricsRegistry,
    @Inject(MonitoringRepository)
    private readonly repository: MonitoringRepository,
  ) {}

  async metrics(): Promise<string> {
    const [readinessResult, heartbeatResult, queueResult] =
      await Promise.allSettled([
        this.healthService.readiness(),
        this.healthService.workerHeartbeatFresh(),
        this.repository.queueSnapshot(),
      ]);
    const snapshot: MonitoringSnapshot = {
      dependencies:
        readinessResult.status === "fulfilled"
          ? {
              database: readinessResult.value.checks.database === "up",
              objectStorage:
                readinessResult.value.checks.objectStorage === "up",
              redis: readinessResult.value.checks.redis === "up",
            }
          : { database: false, objectStorage: false, redis: false },
      dependencyCollectionSuccessful: readinessResult.status === "fulfilled",
      queue: queueResult.status === "fulfilled" ? queueResult.value : null,
      workerHeartbeatCollectionSuccessful:
        heartbeatResult.status === "fulfilled",
      workerHeartbeatFresh:
        heartbeatResult.status === "fulfilled" && heartbeatResult.value,
    };
    return this.registry.render(this.environment.APP_VERSION, snapshot);
  }
}
