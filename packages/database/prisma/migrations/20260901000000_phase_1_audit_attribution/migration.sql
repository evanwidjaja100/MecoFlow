-- Phase 1: Audit attribution with actorMembershipId and systemPrincipal
ALTER TABLE "audit_events" ADD COLUMN "actorMembershipId" UUID;
ALTER TABLE "audit_events" ADD COLUMN "systemPrincipal" VARCHAR(50);

-- Backfill historic system rows (where actorUserId is null) with MIGRATION_SEED
UPDATE "audit_events" SET "systemPrincipal" = 'MIGRATION_SEED' WHERE "actorUserId" IS NULL AND "systemPrincipal" IS NULL;

-- Foreign key to memberships
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorMembershipId_fkey" FOREIGN KEY ("actorMembershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Index for actorMembershipId
CREATE INDEX "audit_events_actorMembershipId_idx" ON "audit_events"("actorMembershipId");

-- Ensure xor between human and system principal
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_check" CHECK (
  ("actorUserId" IS NOT NULL AND "systemPrincipal" IS NULL) OR
  ("actorUserId" IS NULL AND "systemPrincipal" IS NOT NULL)
) NOT VALID;

ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_membership_check" CHECK (
  ("systemPrincipal" IS NOT NULL AND "actorMembershipId" IS NULL) OR
  ("systemPrincipal" IS NULL)
) NOT VALID;
