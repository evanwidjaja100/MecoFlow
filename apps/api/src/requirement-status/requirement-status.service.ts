import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { BomAuthorizationPolicy } from "../boms/bom-authorization.policy.js";
import { RequirementStatusRepository } from "./requirement-status.repository.js";

@Injectable()
export class RequirementStatusService {
  constructor(
    @Inject(BomAuthorizationPolicy)
    private readonly policy: BomAuthorizationPolicy,
    @Inject(RequirementStatusRepository)
    private readonly repository: RequirementStatusRepository,
  ) {}

  async projectStatus(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireRead(principal, projectId);
    return this.repository.projectStatus(projectId);
  }
}
