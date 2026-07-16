export type OrganizationKind = "INTERNAL" | "SUPPLIER";

export interface PrincipalMembership {
  id: string;
  organization: {
    id: string;
    code: string;
    name: string;
    type: OrganizationKind;
  };
  permissions: ReadonlySet<string>;
  roles: readonly string[];
}

export interface AuthenticatedPrincipal {
  sessionId: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    locale: string;
  };
  memberships: readonly PrincipalMembership[];
}

export interface RequestContext {
  correlationId: string;
  requestId: string;
}
