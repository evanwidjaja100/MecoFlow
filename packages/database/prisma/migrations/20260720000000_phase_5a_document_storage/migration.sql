CREATE TYPE "DocumentVersionStatus" AS ENUM (
  'QUARANTINED', 'DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'SCAN_FAILED'
);
CREATE TYPE "VirusScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'ERROR');
CREATE TYPE "DocumentAssociationType" AS ENUM (
  'PROJECT', 'WORK_PACKAGE', 'BOM', 'PURCHASE_REQUISITION', 'PURCHASE_ORDER'
);

CREATE TABLE "documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "ownerOrganizationId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "description" VARCHAR(2000) NOT NULL DEFAULT '',
  "currentVersionNumber" INTEGER NOT NULL DEFAULT 1,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "documents_version_check" CHECK ("version" > 0 AND "currentVersionNumber" > 0),
  CONSTRAINT "documents_title_category_check" CHECK (length(btrim("title")) > 0 AND length(btrim("category")) > 0),
  CONSTRAINT "documents_project_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "documents_owner_organization_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "document_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "DocumentVersionStatus" NOT NULL DEFAULT 'QUARANTINED',
  "scanStatus" "VirusScanStatus" NOT NULL DEFAULT 'PENDING',
  "storageKey" VARCHAR(500) NOT NULL,
  "originalFileName" VARCHAR(255) NOT NULL,
  "extension" VARCHAR(10) NOT NULL,
  "declaredMimeType" VARCHAR(150) NOT NULL,
  "detectedMimeType" VARCHAR(150),
  "byteSize" INTEGER NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "uploadExpiresAt" TIMESTAMPTZ(3) NOT NULL,
  "uploadedAt" TIMESTAMPTZ(3),
  "scannedAt" TIMESTAMPTZ(3),
  "scanResultCode" VARCHAR(100),
  "createdByUserId" UUID NOT NULL,
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMPTZ(3),
  "reviewReason" VARCHAR(500) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_versions_positive_check" CHECK ("versionNumber" > 0 AND "version" > 0 AND "byteSize" > 0 AND "byteSize" <= 10485760),
  CONSTRAINT "document_versions_checksum_check" CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "document_versions_extension_check" CHECK ("extension" IN ('pdf', 'png', 'jpg', 'jpeg', 'txt', 'csv')),
  CONSTRAINT "document_versions_document_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "document_versions_created_by_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "document_versions_reviewed_by_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "document_associations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL,
  "entityType" "DocumentAssociationType" NOT NULL,
  "entityId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_associations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_associations_document_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "document_version_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "documentVersionId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "sourceStatus" "DocumentVersionStatus" NOT NULL,
  "targetStatus" "DocumentVersionStatus" NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_version_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_version_transitions_version_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "document_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "document_version_transitions_actor_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "documents_project_updated_idx" ON "documents"("projectId", "updatedAt");
CREATE INDEX "documents_owner_project_idx" ON "documents"("ownerOrganizationId", "projectId");
CREATE UNIQUE INDEX "document_versions_storage_key_key" ON "document_versions"("storageKey");
CREATE UNIQUE INDEX "document_versions_document_number_key" ON "document_versions"("documentId", "versionNumber");
CREATE INDEX "document_versions_document_status_idx" ON "document_versions"("documentId", "status", "versionNumber");
CREATE INDEX "document_versions_scan_status_idx" ON "document_versions"("scanStatus", "status", "createdAt");
CREATE INDEX "document_versions_sha256_idx" ON "document_versions"("sha256");
CREATE UNIQUE INDEX "document_associations_unique" ON "document_associations"("documentId", "entityType", "entityId");
CREATE INDEX "document_associations_entity_idx" ON "document_associations"("entityType", "entityId");
CREATE INDEX "document_version_transitions_version_time_idx" ON "document_version_transitions"("documentVersionId", "occurredAt");

CREATE OR REPLACE FUNCTION prevent_document_history_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'document history is immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_associations_no_update
BEFORE UPDATE OR DELETE ON "document_associations"
FOR EACH ROW EXECUTE FUNCTION prevent_document_history_mutation();

CREATE TRIGGER document_version_transitions_no_update
BEFORE UPDATE OR DELETE ON "document_version_transitions"
FOR EACH ROW EXECUTE FUNCTION prevent_document_history_mutation();

CREATE OR REPLACE FUNCTION guard_document_version_update() RETURNS trigger AS $$
BEGIN
  IF NEW."documentId" <> OLD."documentId"
     OR NEW."versionNumber" <> OLD."versionNumber"
     OR NEW."storageKey" <> OLD."storageKey"
     OR NEW."originalFileName" <> OLD."originalFileName"
     OR NEW."extension" <> OLD."extension"
     OR NEW."declaredMimeType" <> OLD."declaredMimeType"
     OR NEW."byteSize" <> OLD."byteSize"
     OR NEW."sha256" <> OLD."sha256"
     OR NEW."uploadExpiresAt" <> OLD."uploadExpiresAt"
     OR NEW."createdByUserId" <> OLD."createdByUserId"
     OR NEW."createdAt" <> OLD."createdAt" THEN
    RAISE EXCEPTION 'document version file metadata is immutable';
  END IF;

  IF OLD."status" = 'APPROVED' AND NEW."status" <> 'SUPERSEDED' THEN
    RAISE EXCEPTION 'approved document versions are immutable';
  END IF;

  IF NEW."status" <> OLD."status" AND NOT (
    (OLD."status" = 'QUARANTINED' AND NEW."status" IN ('DRAFT', 'SCAN_FAILED')) OR
    (OLD."status" = 'DRAFT' AND NEW."status" = 'IN_REVIEW') OR
    (OLD."status" = 'IN_REVIEW' AND NEW."status" IN ('APPROVED', 'REJECTED')) OR
    (OLD."status" = 'APPROVED' AND NEW."status" = 'SUPERSEDED')
  ) THEN
    RAISE EXCEPTION 'invalid document version transition';
  END IF;

  IF NEW."scanStatus" <> OLD."scanStatus" AND NOT (
    OLD."scanStatus" = 'PENDING' AND NEW."scanStatus" IN ('CLEAN', 'INFECTED', 'ERROR')
  ) THEN
    RAISE EXCEPTION 'invalid virus scan transition';
  END IF;

  IF NEW."status" IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED')
     AND NEW."scanStatus" <> 'CLEAN' THEN
    RAISE EXCEPTION 'non-clean document cannot enter review workflow';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_versions_guard_update
BEFORE UPDATE ON "document_versions"
FOR EACH ROW EXECUTE FUNCTION guard_document_version_update();

CREATE TRIGGER document_versions_no_delete
BEFORE DELETE ON "document_versions"
FOR EACH ROW EXECUTE FUNCTION prevent_document_history_mutation();

CREATE TRIGGER documents_no_delete
BEFORE DELETE ON "documents"
FOR EACH ROW EXECUTE FUNCTION prevent_document_history_mutation();
