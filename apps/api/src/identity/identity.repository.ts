import { Inject, Injectable } from "@nestjs/common";
import { createDatabaseClient, type PrismaClient } from "@mecoflow/database";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type { AuthenticatedPrincipal } from "./identity.types.js";

interface OidcIdentity {
  displayName: string;
  email: string;
  issuer: string;
  locale: string;
  subject: string;
}

@Injectable()
export class IdentityRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  async createAuthTransaction(input: {
    codeVerifier: string;
    expiresAt: Date;
    nonce: string;
    returnTo: string;
    stateHash: string;
  }): Promise<void> {
    await this.database.oidcAuthTransaction.create({ data: input });
  }

  async consumeAuthTransaction(stateHash: string) {
    return this.database.$transaction(async (transaction) => {
      const authTransaction = await transaction.oidcAuthTransaction.findUnique({
        where: { stateHash },
      });
      if (!authTransaction) return null;
      await transaction.oidcAuthTransaction.delete({ where: { stateHash } });
      return authTransaction;
    });
  }

  async synchronizeIdentity(identity: OidcIdentity): Promise<string> {
    const profile = await this.database.userProfile.upsert({
      create: {
        displayName: identity.displayName,
        email: identity.email,
        issuer: identity.issuer,
        lastLoginAt: new Date(),
        locale: identity.locale,
        subject: identity.subject,
      },
      update: {
        displayName: identity.displayName,
        email: identity.email,
        lastLoginAt: new Date(),
        locale: identity.locale,
        version: { increment: 1 },
      },
      where: {
        issuer_subject: { issuer: identity.issuer, subject: identity.subject },
      },
    });
    return profile.id;
  }

  async createSession(input: {
    csrfTokenHash: string;
    expiresAt: Date;
    tokenHash: string;
    userId: string;
  }): Promise<void> {
    await this.database.session.create({ data: input });
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.database.session.updateMany({
      data: { revokedAt: new Date() },
      where: { tokenHash, revokedAt: null },
    });
  }

  async findPrincipal(tokenHash: string): Promise<
    | { kind: "INVALID" }
    | { kind: "INACTIVE_USER" }
    | { kind: "NO_ACTIVE_MEMBERSHIP" }
    | {
        kind: "ACTIVE";
        principal: AuthenticatedPrincipal;
        csrfTokenHash: string;
      }
  > {
    const session = await this.database.session.findUnique({
      include: {
        user: {
          include: {
            memberships: {
              include: {
                organization: true,
                roles: {
                  include: {
                    role: {
                      include: { permissions: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: { tokenHash },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date())
      return { kind: "INVALID" };
    if (session.user.status !== "ACTIVE") return { kind: "INACTIVE_USER" };

    const memberships = session.user.memberships
      .filter(
        (membership) =>
          membership.status === "ACTIVE" && membership.organization.active,
      )
      .map((membership) => ({
        id: membership.id,
        organization: {
          code: membership.organization.code,
          id: membership.organization.id,
          name: membership.organization.name,
          type: membership.organization.type,
        },
        permissions: new Set(
          membership.roles.flatMap(({ role }) =>
            role.permissions.map(({ permissionCode }) => permissionCode),
          ),
        ),
        roles: membership.roles.map(({ roleCode }) => roleCode).sort(),
      }));
    if (memberships.length === 0) return { kind: "NO_ACTIVE_MEMBERSHIP" };

    return {
      csrfTokenHash: session.csrfTokenHash,
      kind: "ACTIVE",
      principal: {
        memberships,
        sessionId: session.id,
        user: {
          displayName: session.user.displayName,
          email: session.user.email,
          id: session.user.id,
          locale: session.user.locale,
        },
      },
    };
  }
}
