import { Module } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import { HealthController } from "./health/health.controller.js";
import { HealthService } from "./health/health.service.js";
import { SERVICE_ENVIRONMENT } from "./tokens.js";
import { AdministrationController } from "./administration/administration.controller.js";
import { AdministrationRepository } from "./administration/administration.repository.js";
import { AdministrationService } from "./administration/administration.service.js";
import { AuthorizationPolicy } from "./authorization/authorization.policy.js";
import { AuthController } from "./identity/auth.controller.js";
import { IdentityRepository } from "./identity/identity.repository.js";
import { IdentityService } from "./identity/identity.service.js";
import { MeController } from "./identity/me.controller.js";
import { OidcService } from "./identity/oidc.service.js";

@Module({})
export class AppModule {
  static register(environment: ServiceEnvironment) {
    return {
      module: AppModule,
      controllers: [
        HealthController,
        AuthController,
        MeController,
        AdministrationController,
      ],
      providers: [
        HealthService,
        IdentityRepository,
        OidcService,
        IdentityService,
        AuthorizationPolicy,
        AdministrationRepository,
        AdministrationService,
        { provide: SERVICE_ENVIRONMENT, useValue: environment },
      ],
    };
  }
}
