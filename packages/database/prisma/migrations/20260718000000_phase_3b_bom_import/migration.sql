CREATE TYPE "BomRevisionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'RELEASED', 'SUPERSEDED', 'CANCELLED');
CREATE TYPE "BomLineCriticality" AS ENUM ('CRITICAL', 'HIGH', 'NORMAL', 'LOW');
CREATE TYPE "BomImportStatus" AS ENUM ('QUEUED', 'PARSING', 'READY', 'FAILED', 'CONFIRMED');
CREATE TYPE "StoredFileStatus" AS ENUM ('QUARANTINED', 'VALIDATED', 'REJECTED');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

CREATE TABLE "stored_files" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "storageKey" VARCHAR(500) NOT NULL,
  "originalFileName" VARCHAR(255) NOT NULL,
  "extension" VARCHAR(10) NOT NULL,
  "mimeType" VARCHAR(150) NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "status" "StoredFileStatus" NOT NULL DEFAULT 'QUARANTINED',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stored_files_byte_size_check" CHECK ("byteSize" > 0 AND "byteSize" <= 5242880),
  CONSTRAINT "stored_files_sha256_check" CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "stored_files_extension_check" CHECK ("extension" IN ('csv', 'xlsx'))
);

CREATE UNIQUE INDEX "stored_files_storageKey_key" ON "stored_files"("storageKey");
CREATE INDEX "stored_files_sha256_idx" ON "stored_files"("sha256");
CREATE UNIQUE INDEX "work_packages_id_projectId_phase3b_key" ON "work_packages"("id", "projectId");

CREATE TABLE "boms" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "workPackageId" UUID,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "boms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "boms_version_check" CHECK ("version" >= 1),
  CONSTRAINT "boms_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "boms_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "work_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "boms_workPackage_project_scope_fkey" FOREIGN KEY ("workPackageId", "projectId") REFERENCES "work_packages"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "boms_projectId_workPackageId_key" ON "boms"("projectId", "workPackageId");
CREATE UNIQUE INDEX "boms_project_scope_key" ON "boms"("projectId") WHERE "workPackageId" IS NULL;
CREATE INDEX "boms_projectId_updatedAt_idx" ON "boms"("projectId", "updatedAt");

CREATE TABLE "bom_imports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "workPackageId" UUID,
  "sourceFileId" UUID NOT NULL,
  "requestedByUserId" UUID NOT NULL,
  "auditOrganizationId" UUID NOT NULL,
  "status" "BomImportStatus" NOT NULL DEFAULT 'QUEUED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "warningCount" INTEGER NOT NULL DEFAULT 0,
  "failureCode" VARCHAR(100),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "parsedAt" TIMESTAMPTZ(3),
  "confirmedAt" TIMESTAMPTZ(3),
  CONSTRAINT "bom_imports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bom_imports_version_check" CHECK ("version" >= 1),
  CONSTRAINT "bom_imports_counts_check" CHECK ("rowCount" >= 0 AND "errorCount" >= 0 AND "warningCount" >= 0),
  CONSTRAINT "bom_imports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_imports_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "work_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_imports_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_imports_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_imports_auditOrganizationId_fkey" FOREIGN KEY ("auditOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_imports_workPackage_project_scope_fkey" FOREIGN KEY ("workPackageId", "projectId") REFERENCES "work_packages"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "bom_imports_projectId_createdAt_idx" ON "bom_imports"("projectId", "createdAt");
CREATE INDEX "bom_imports_status_createdAt_idx" ON "bom_imports"("status", "createdAt");

CREATE TABLE "bom_revisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bomId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "status" "BomRevisionStatus" NOT NULL DEFAULT 'DRAFT',
  "title" VARCHAR(200) NOT NULL,
  "notes" VARCHAR(2000) NOT NULL DEFAULT '',
  "version" INTEGER NOT NULL DEFAULT 1,
  "sourceFileId" UUID,
  "sourceChecksum" CHAR(64),
  "sourceImportId" UUID,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "reviewedAt" TIMESTAMPTZ(3),
  "releasedAt" TIMESTAMPTZ(3),
  "supersededAt" TIMESTAMPTZ(3),
  "cancelledAt" TIMESTAMPTZ(3),
  CONSTRAINT "bom_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bom_revisions_revision_check" CHECK ("revisionNumber" >= 1),
  CONSTRAINT "bom_revisions_version_check" CHECK ("version" >= 1),
  CONSTRAINT "bom_revisions_checksum_check" CHECK ("sourceChecksum" IS NULL OR "sourceChecksum" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "bom_revisions_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_revisions_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_revisions_sourceImportId_fkey" FOREIGN KEY ("sourceImportId") REFERENCES "bom_imports"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_revisions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "bom_revisions_bomId_revisionNumber_key" ON "bom_revisions"("bomId", "revisionNumber");
CREATE UNIQUE INDEX "bom_revisions_sourceImportId_key" ON "bom_revisions"("sourceImportId");
CREATE UNIQUE INDEX "bom_revisions_one_released_per_bom_key" ON "bom_revisions"("bomId") WHERE "status" = 'RELEASED';
CREATE INDEX "bom_revisions_bomId_status_updatedAt_idx" ON "bom_revisions"("bomId", "status", "updatedAt");

CREATE TABLE "bom_import_rows" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bomImportId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "rawData" JSONB NOT NULL,
  "itemId" UUID,
  "unitOfMeasureId" UUID,
  "quantity" DECIMAL(30,6),
  "criticality" "BomLineCriticality",
  "notes" VARCHAR(1000) NOT NULL DEFAULT '',
  "errors" JSONB NOT NULL,
  "warnings" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bom_import_rows_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bom_import_rows_row_check" CHECK ("rowNumber" >= 2),
  CONSTRAINT "bom_import_rows_quantity_check" CHECK ("quantity" IS NULL OR "quantity" > 0),
  CONSTRAINT "bom_import_rows_bomImportId_fkey" FOREIGN KEY ("bomImportId") REFERENCES "bom_imports"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_import_rows_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_import_rows_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "bom_import_rows_bomImportId_rowNumber_key" ON "bom_import_rows"("bomImportId", "rowNumber");
CREATE INDEX "bom_import_rows_itemId_idx" ON "bom_import_rows"("itemId");

CREATE TABLE "bom_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bomRevisionId" UUID NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "itemId" UUID NOT NULL,
  "unitOfMeasureId" UUID NOT NULL,
  "quantity" DECIMAL(30,6) NOT NULL,
  "criticality" "BomLineCriticality" NOT NULL DEFAULT 'NORMAL',
  "notes" VARCHAR(1000) NOT NULL DEFAULT '',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "bom_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bom_lines_line_check" CHECK ("lineNumber" >= 1),
  CONSTRAINT "bom_lines_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "bom_lines_version_check" CHECK ("version" >= 1),
  CONSTRAINT "bom_lines_bomRevisionId_fkey" FOREIGN KEY ("bomRevisionId") REFERENCES "bom_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_lines_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_lines_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "bom_lines_bomRevisionId_lineNumber_key" ON "bom_lines"("bomRevisionId", "lineNumber");
CREATE INDEX "bom_lines_itemId_bomRevisionId_idx" ON "bom_lines"("itemId", "bomRevisionId");

CREATE TABLE "bom_revision_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bomRevisionId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "sourceStatus" "BomRevisionStatus" NOT NULL,
  "targetStatus" "BomRevisionStatus" NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bom_revision_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bom_revision_transitions_revision_fkey" FOREIGN KEY ("bomRevisionId") REFERENCES "bom_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bom_revision_transitions_actor_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "bom_revision_transitions_revision_occurred_idx" ON "bom_revision_transitions"("bomRevisionId", "occurredAt");

CREATE TABLE "outbox_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "eventType" VARCHAR(100) NOT NULL,
  "aggregateType" VARCHAR(100) NOT NULL,
  "aggregateId" VARCHAR(100) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMPTZ(3),
  "processedAt" TIMESTAMPTZ(3),
  "lastErrorCode" VARCHAR(100),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "outbox_events_attempts_check" CHECK ("attempts" >= 0)
);

CREATE INDEX "outbox_events_status_availableAt_createdAt_idx" ON "outbox_events"("status", "availableAt", "createdAt");
CREATE INDEX "outbox_events_aggregateType_aggregateId_idx" ON "outbox_events"("aggregateType", "aggregateId");

CREATE FUNCTION prevent_bom_revision_transition_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'BOM revision transition history is immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "bom_revision_transitions_immutable"
BEFORE UPDATE OR DELETE ON "bom_revision_transitions"
FOR EACH ROW EXECUTE FUNCTION prevent_bom_revision_transition_mutation();

CREATE FUNCTION guard_bom_revision_status_transition() RETURNS trigger AS $$
BEGIN
  IF NEW."status" = OLD."status" THEN
    RETURN NEW;
  END IF;
  IF NOT (
    (OLD."status" = 'DRAFT' AND NEW."status" IN ('IN_REVIEW', 'CANCELLED')) OR
    (OLD."status" = 'IN_REVIEW' AND NEW."status" IN ('RELEASED', 'CANCELLED')) OR
    (OLD."status" = 'RELEASED' AND NEW."status" = 'SUPERSEDED')
  ) THEN
    RAISE EXCEPTION 'Invalid BOM revision status transition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "bom_revision_status_guard"
BEFORE UPDATE OF "status" ON "bom_revisions"
FOR EACH ROW EXECUTE FUNCTION guard_bom_revision_status_transition();

CREATE FUNCTION guard_bom_line_mutation() RETURNS trigger AS $$
DECLARE revision_status "BomRevisionStatus";
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT "status" INTO revision_status
    FROM "bom_revisions"
    WHERE "id" = OLD."bomRevisionId";
    IF revision_status <> 'DRAFT' THEN
      RAISE EXCEPTION 'Only draft BOM revision lines may be changed';
    END IF;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    SELECT "status" INTO revision_status
    FROM "bom_revisions"
    WHERE "id" = NEW."bomRevisionId";
    IF revision_status <> 'DRAFT' THEN
      RAISE EXCEPTION 'Only draft BOM revision lines may be changed';
    END IF;
  END IF;
  IF TG_OP <> 'DELETE' AND NOT EXISTS (
    SELECT 1 FROM "items"
    WHERE "id" = NEW."itemId"
      AND "unitOfMeasureId" = NEW."unitOfMeasureId"
  ) THEN
    RAISE EXCEPTION 'BOM line unit must equal the item base unit';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "bom_lines_draft_only"
BEFORE INSERT OR UPDATE OR DELETE ON "bom_lines"
FOR EACH ROW EXECUTE FUNCTION guard_bom_line_mutation();

CREATE VIEW "official_bom_lines" AS
SELECT line.*
FROM "bom_lines" line
JOIN "bom_revisions" revision ON revision."id" = line."bomRevisionId"
WHERE revision."status" = 'RELEASED';
