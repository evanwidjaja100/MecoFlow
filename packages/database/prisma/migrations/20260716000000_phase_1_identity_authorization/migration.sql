CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "OrganizationType" AS ENUM ('INTERNAL', 'SUPPLIER');
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "RoleScope" AS ENUM ('INTERNAL', 'SUPPLIER', 'ANY');

CREATE TABLE "user_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "issuer" VARCHAR(500) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "displayName" VARCHAR(200) NOT NULL,
  "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastLoginAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_profiles_issuer_subject_key" ON "user_profiles"("issuer", "subject");
CREATE INDEX "user_profiles_email_idx" ON "user_profiles"("email");

CREATE TABLE "organizations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "type" "OrganizationType" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

CREATE TABLE "memberships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "memberships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "memberships_userId_organizationId_key" ON "memberships"("userId", "organizationId");
CREATE INDEX "memberships_organizationId_status_idx" ON "memberships"("organizationId", "status");

CREATE TABLE "roles" (
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  "scope" "RoleScope" NOT NULL,
  "system" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("code")
);
CREATE TABLE "permissions" (
  "code" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("code")
);
CREATE TABLE "role_permissions" (
  "roleCode" VARCHAR(50) NOT NULL,
  "permissionCode" VARCHAR(100) NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleCode", "permissionCode"),
  CONSTRAINT "role_permissions_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "roles"("code") ON DELETE RESTRICT,
  CONSTRAINT "role_permissions_permissionCode_fkey" FOREIGN KEY ("permissionCode") REFERENCES "permissions"("code") ON DELETE RESTRICT
);
CREATE TABLE "membership_roles" (
  "membershipId" UUID NOT NULL,
  "roleCode" VARCHAR(50) NOT NULL,
  "assignedByUserId" UUID,
  "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("membershipId", "roleCode"),
  CONSTRAINT "membership_roles_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT,
  CONSTRAINT "membership_roles_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "roles"("code") ON DELETE RESTRICT,
  CONSTRAINT "membership_roles_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT
);
CREATE INDEX "membership_roles_assignedByUserId_idx" ON "membership_roles"("assignedByUserId");

CREATE TABLE "sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tokenHash" CHAR(64) NOT NULL,
  "csrfTokenHash" CHAR(64) NOT NULL,
  "userId" UUID NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "revokedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");

CREATE TABLE "oidc_auth_transactions" (
  "stateHash" CHAR(64) NOT NULL,
  "codeVerifier" VARCHAR(128) NOT NULL,
  "nonce" VARCHAR(128) NOT NULL,
  "returnTo" VARCHAR(500) NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oidc_auth_transactions_pkey" PRIMARY KEY ("stateHash")
);
CREATE INDEX "oidc_auth_transactions_expiresAt_idx" ON "oidc_auth_transactions"("expiresAt");

CREATE TABLE "audit_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorUserId" UUID,
  "organizationId" UUID,
  "action" VARCHAR(100) NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" VARCHAR(100) NOT NULL,
  "requestId" VARCHAR(128) NOT NULL,
  "correlationId" VARCHAR(128) NOT NULL,
  "outcome" VARCHAR(30) NOT NULL,
  "changes" JSONB NOT NULL,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "audit_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT
);
CREATE INDEX "audit_events_organizationId_occurredAt_idx" ON "audit_events"("organizationId", "occurredAt");
CREATE INDEX "audit_events_entityType_entityId_occurredAt_idx" ON "audit_events"("entityType", "entityId", "occurredAt");

CREATE FUNCTION prevent_audit_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit events are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER audit_events_immutable_update BEFORE UPDATE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
CREATE TRIGGER audit_events_immutable_delete BEFORE DELETE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
