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
import { ProjectsController } from "./projects/projects.controller.js";
import { ProjectAuthorizationPolicy } from "./projects/project-authorization.policy.js";
import { ProjectsRepository } from "./projects/projects.repository.js";
import { ProjectsService } from "./projects/projects.service.js";
import { ItemsController } from "./items/items.controller.js";
import { ItemAuthorizationPolicy } from "./items/item-authorization.policy.js";
import { ItemsRepository } from "./items/items.repository.js";
import { ItemsService } from "./items/items.service.js";
import { BomsController } from "./boms/boms.controller.js";
import { BomAuthorizationPolicy } from "./boms/bom-authorization.policy.js";
import { BomsRepository } from "./boms/boms.repository.js";
import { BomsService } from "./boms/boms.service.js";
import { BomStorageService } from "./boms/bom-storage.service.js";
import { RequisitionsController } from "./requisitions/requisitions.controller.js";
import { RequisitionAuthorizationPolicy } from "./requisitions/requisition-authorization.policy.js";
import { RequisitionsRepository } from "./requisitions/requisitions.repository.js";
import { RequisitionsService } from "./requisitions/requisitions.service.js";
import { PurchaseOrdersController } from "./purchase-orders/purchase-orders.controller.js";
import { PurchaseOrderAuthorizationPolicy } from "./purchase-orders/purchase-order-authorization.policy.js";
import { PurchaseOrdersRepository } from "./purchase-orders/purchase-orders.repository.js";
import { PurchaseOrdersService } from "./purchase-orders/purchase-orders.service.js";
import { DocumentsController } from "./documents/documents.controller.js";
import { DocumentAuthorizationPolicy } from "./documents/document-authorization.policy.js";
import { DocumentsRepository } from "./documents/documents.repository.js";
import { DocumentsService } from "./documents/documents.service.js";
import { DocumentStorageService } from "./documents/document-storage.service.js";
import {
  ClamAvVirusScanner,
  VIRUS_SCANNER,
} from "./documents/virus-scanner.js";
import { ReceivingController } from "./receiving/receiving.controller.js";
import { ReceivingAuthorizationPolicy } from "./receiving/receiving-authorization.policy.js";
import { ReceivingRepository } from "./receiving/receiving.repository.js";
import { ReceivingService } from "./receiving/receiving.service.js";

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
        ProjectsController,
        ItemsController,
        BomsController,
        RequisitionsController,
        PurchaseOrdersController,
        DocumentsController,
        ReceivingController,
      ],
      providers: [
        HealthService,
        IdentityRepository,
        OidcService,
        IdentityService,
        AuthorizationPolicy,
        AdministrationRepository,
        AdministrationService,
        ProjectsRepository,
        ProjectAuthorizationPolicy,
        ProjectsService,
        ItemsRepository,
        ItemAuthorizationPolicy,
        ItemsService,
        BomsRepository,
        BomAuthorizationPolicy,
        BomStorageService,
        BomsService,
        RequisitionsRepository,
        RequisitionAuthorizationPolicy,
        RequisitionsService,
        PurchaseOrdersRepository,
        PurchaseOrderAuthorizationPolicy,
        PurchaseOrdersService,
        DocumentsRepository,
        DocumentAuthorizationPolicy,
        DocumentStorageService,
        ClamAvVirusScanner,
        { provide: VIRUS_SCANNER, useExisting: ClamAvVirusScanner },
        DocumentsService,
        ReceivingRepository,
        ReceivingAuthorizationPolicy,
        ReceivingService,
        { provide: SERVICE_ENVIRONMENT, useValue: environment },
      ],
    };
  }
}
