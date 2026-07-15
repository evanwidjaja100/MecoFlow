import { Module } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { HealthController } from "./health/health.controller.js";
import { HealthService } from "./health/health.service.js";
import { SERVICE_ENVIRONMENT } from "./tokens.js";

@Module({})
export class AppModule {
  static register(environment: ServiceEnvironment) {
    return {
      module: AppModule,
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: SERVICE_ENVIRONMENT, useValue: environment },
      ],
    };
  }
}
