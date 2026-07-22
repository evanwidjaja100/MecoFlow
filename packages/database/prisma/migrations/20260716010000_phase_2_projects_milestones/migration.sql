CREATE TYPE "ProjectState" AS ENUM ('DRAFT', 'PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProjectMemberRole" AS ENUM ('PROJECT_MANAGER', 'CONTRIBUTOR', 'VIEWER', 'SUPPLIER');
CREATE TYPE "ProjectMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "product_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_categories_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "product_categories_code_key" ON "product_categories"("code");
CREATE INDEX "product_categories_active_name_idx" ON "product_categories"("active", "name");

CREATE TABLE "projects" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "productCategoryId" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000) NOT NULL DEFAULT '',
  "state" "ProjectState" NOT NULL DEFAULT 'DRAFT',
  "plannedStartDate" DATE NOT NULL,
  "plannedEndDate" DATE NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT,
  CONSTRAINT "projects_productCategoryId_fkey" FOREIGN KEY ("productCategoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT,
  CONSTRAINT "projects_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "projects_date_order_check" CHECK ("plannedEndDate" >= "plannedStartDate"),
  CONSTRAINT "projects_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "projects_organizationId_code_key" ON "projects"("organizationId", "code");
CREATE INDEX "projects_organizationId_state_updatedAt_idx" ON "projects"("organizationId", "state", "updatedAt");
CREATE INDEX "projects_productCategoryId_state_idx" ON "projects"("productCategoryId", "state");

CREATE TABLE "project_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "membershipId" UUID NOT NULL,
  "role" "ProjectMemberRole" NOT NULL,
  "status" "ProjectMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "addedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "project_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_members_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_members_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_members_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "project_members_projectId_membershipId_key" ON "project_members"("projectId", "membershipId");
CREATE INDEX "project_members_membershipId_status_idx" ON "project_members"("membershipId", "status");

CREATE TABLE "milestones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(1000) NOT NULL DEFAULT '',
  "targetDate" DATE NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "milestones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
  CONSTRAINT "milestones_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "milestones_projectId_code_key" ON "milestones"("projectId", "code");
CREATE INDEX "milestones_projectId_targetDate_idx" ON "milestones"("projectId", "targetDate");

CREATE TABLE "work_packages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "milestoneId" UUID,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(1000) NOT NULL DEFAULT '',
  "plannedStartDate" DATE NOT NULL,
  "plannedEndDate" DATE NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "work_packages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_packages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
  CONSTRAINT "work_packages_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE RESTRICT,
  CONSTRAINT "work_packages_date_order_check" CHECK ("plannedEndDate" >= "plannedStartDate"),
  CONSTRAINT "work_packages_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "work_packages_projectId_code_key" ON "work_packages"("projectId", "code");
CREATE INDEX "work_packages_projectId_plannedStartDate_idx" ON "work_packages"("projectId", "plannedStartDate");
CREATE INDEX "work_packages_milestoneId_idx" ON "work_packages"("milestoneId");

CREATE TABLE "project_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "sourceState" "ProjectState" NOT NULL,
  "targetState" "ProjectState" NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_transitions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_transitions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "project_transitions_state_change_check" CHECK ("sourceState" <> "targetState")
);
CREATE INDEX "project_transitions_projectId_occurredAt_idx" ON "project_transitions"("projectId", "occurredAt");

CREATE FUNCTION prevent_project_transition_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'project transitions are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER project_transitions_immutable_update BEFORE UPDATE ON "project_transitions" FOR EACH ROW EXECUTE FUNCTION prevent_project_transition_mutation();
CREATE TRIGGER project_transitions_immutable_delete BEFORE DELETE ON "project_transitions" FOR EACH ROW EXECUTE FUNCTION prevent_project_transition_mutation();
