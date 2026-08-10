import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { ReadinessAuthorizationPolicy } from "./readiness-authorization.policy.js";
import { ReadinessRepository } from "./readiness.repository.js";

@Injectable()
export class ReadinessService {
  constructor(
    @Inject(ReadinessAuthorizationPolicy)
    private readonly policy: ReadinessAuthorizationPolicy,
    @Inject(ReadinessRepository)
    private readonly repository: ReadinessRepository,
  ) {}

  management(
    principal: AuthenticatedPrincipal,
    input: { page?: string; pageSize?: string },
  ) {
    this.policy.requireManagement(principal);
    const page = Number(input.page ?? "1");
    const pageSize = Number(input.pageSize ?? "20");
    if (page < 1 || pageSize < 1 || pageSize > 100)
      throw new UnprocessableEntityException("Invalid pagination");
    return this.repository.management(principal, { page, pageSize });
  }

  async overview(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireProject(principal, projectId);
    return this.repository.overview(projectId);
  }

  async materials(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireProject(principal, projectId);
    return this.repository.materials(projectId);
  }

  async history(principal: AuthenticatedPrincipal, projectId: string) {
    await this.policy.requireProject(principal, projectId);
    return this.repository.history(projectId);
  }
}
