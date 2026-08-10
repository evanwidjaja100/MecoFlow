ALTER TYPE "OutboxStatus" ADD VALUE 'DEAD_LETTER';

CREATE TYPE "NotificationType" AS ENUM (
  'READINESS_ALERT',
  'READINESS_REMINDER'
);

CREATE TYPE "EmailDeliveryStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'SKIPPED',
  'DEAD_LETTER'
);

ALTER TABLE "outbox_events"
  ADD COLUMN "deadLetteredAt" TIMESTAMPTZ(3);

CREATE TABLE "notification_preferences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_preferences_version_check" CHECK ("version" > 0),
  CONSTRAINT "notification_preferences_user_fkey"
    FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "notification_preferences_user_type_key"
  ON "notification_preferences"("userId", "type");
CREATE INDEX "notification_preferences_user_updated_idx"
  ON "notification_preferences"("userId", "updatedAt");

CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "sourceOutboxEventId" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "actionUrl" VARCHAR(500) NOT NULL,
  "visibleInApp" BOOLEAN NOT NULL DEFAULT true,
  "readAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_user_fkey"
    FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "notifications_project_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "notifications_source_event_fkey"
    FOREIGN KEY ("sourceOutboxEventId") REFERENCES "outbox_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "notifications_source_event_user_key"
  ON "notifications"("sourceOutboxEventId", "userId");
CREATE INDEX "notifications_user_visible_read_created_idx"
  ON "notifications"("userId", "visibleInApp", "readAt", "createdAt");
CREATE INDEX "notifications_project_created_idx"
  ON "notifications"("projectId", "createdAt");

CREATE TABLE "notification_email_deliveries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "notificationId" UUID NOT NULL,
  "emailAddress" VARCHAR(320) NOT NULL,
  "messageId" VARCHAR(255) NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMPTZ(3),
  "sentAt" TIMESTAMPTZ(3),
  "deadLetteredAt" TIMESTAMPTZ(3),
  "lastErrorCode" VARCHAR(100),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_email_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_email_deliveries_attempts_check" CHECK ("attempts" >= 0),
  CONSTRAINT "notification_email_deliveries_notification_fkey"
    FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "notification_email_deliveries_notification_key"
  ON "notification_email_deliveries"("notificationId");
CREATE UNIQUE INDEX "notification_email_deliveries_message_key"
  ON "notification_email_deliveries"("messageId");
CREATE INDEX "notification_email_deliveries_status_available_created_idx"
  ON "notification_email_deliveries"("status", "availableAt", "createdAt");

CREATE FUNCTION enqueue_readiness_notification_event() RETURNS trigger AS $$
BEGIN
  IF NEW."scopeType" <> 'PROJECT' THEN
    RETURN NEW;
  END IF;

  INSERT INTO "outbox_events" (
    "eventType",
    "aggregateType",
    "aggregateId",
    "payload"
  ) VALUES (
    CASE
      WHEN NEW."trigger" = 'SCHEDULED' THEN 'READINESS_REMINDER_REQUESTED'
      ELSE 'READINESS_ALERT_REQUESTED'
    END,
    'ReadinessSnapshot',
    NEW."id"::text,
    jsonb_build_object(
      'projectId', NEW."projectId"::text,
      'readinessSnapshotId', NEW."id"::text
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER readiness_snapshot_notification_outbox
AFTER INSERT ON "readiness_snapshots"
FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_notification_event();
