-- The readiness portfolio and report queries select the newest PROJECT
-- snapshot per project and use id as the deterministic tie-breaker.
CREATE INDEX "readiness_snapshots_project_latest_idx"
  ON "readiness_snapshots"("projectId", "calculatedAt" DESC, "id" DESC)
  WHERE "scopeType" = 'PROJECT';
