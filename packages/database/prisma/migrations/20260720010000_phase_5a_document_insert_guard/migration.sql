CREATE OR REPLACE FUNCTION guard_document_version_insert() RETURNS trigger AS $$
BEGIN
  IF NEW."status" <> 'QUARANTINED' OR NEW."scanStatus" <> 'PENDING'
     OR NEW."uploadedAt" IS NOT NULL OR NEW."scannedAt" IS NOT NULL
     OR NEW."reviewedAt" IS NOT NULL OR NEW."reviewedByUserId" IS NOT NULL
     OR NEW."detectedMimeType" IS NOT NULL OR NEW."scanResultCode" IS NOT NULL THEN
    RAISE EXCEPTION 'new document versions must begin quarantined and unscanned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_versions_guard_insert
BEFORE INSERT ON "document_versions"
FOR EACH ROW EXECUTE FUNCTION guard_document_version_insert();
