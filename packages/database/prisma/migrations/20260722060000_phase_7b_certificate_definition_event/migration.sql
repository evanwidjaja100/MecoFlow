CREATE OR REPLACE FUNCTION enqueue_readiness_from_certificate_definition() RETURNS trigger AS $$
DECLARE
  target_project_id UUID;
BEGIN
  IF NEW."checkType" = 'CERTIFICATE' OR OLD."checkType" = 'CERTIFICATE' THEN
    FOR target_project_id IN
      SELECT DISTINCT bom."projectId"
      FROM "bom_lines" line
      JOIN "bom_revisions" revision ON revision."id" = line."bomRevisionId"
      JOIN "boms" bom ON bom."id" = revision."bomId"
      WHERE line."itemId" IN (NEW."itemId", OLD."itemId")
        AND revision."status" = 'RELEASED'
    LOOP
      PERFORM enqueue_readiness_recalculation(
        target_project_id,
        TG_TABLE_NAME,
        NEW."id"::text
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER readiness_certificate_definition_event
  AFTER INSERT OR UPDATE ON "inspection_check_definitions"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_certificate_definition();
