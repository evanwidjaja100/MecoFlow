import type { AuthenticatedPrincipal } from "../identity/identity.types.js";

export interface ProjectScope {
  organizationId: string;
  projectId: string;
}

export interface ProjectScopeResolver {
  canAccessProject(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<boolean>;
}

export interface ProjectScopePolicy {
  requireProjectRead(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void>;
  requireProjectWrite(
    principal: AuthenticatedPrincipal,
    scope: ProjectScope,
  ): Promise<void>;
}
