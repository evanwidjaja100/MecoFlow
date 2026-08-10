# Notifications API

## Scope

Phase 8A provides in-app readiness alerts, scheduled daily reminders, own-user preferences, optional SMTP email, bounded retry/dead-letter state, and worker observability. Reports, exports, supplier notifications, and supplier scorecards are absent.

## Event and recipient rules

A new project-scope readiness snapshot atomically creates exactly one identifier-only `READINESS_ALERT_REQUESTED` or `READINESS_REMINDER_REQUESTED` outbox event. Event-triggered snapshots create alerts; changed scheduled snapshots create reminders. The worker re-reads the snapshot and selects only active users reached through an active internal membership, active organization, and active exact project-member assignment.

The unique `(sourceOutboxEventId, userId)` key prevents duplicate notification rows. Email delivery has one unique row and deterministic message ID per notification. A replay cannot send a `SENT` delivery again. An ambiguous stale `PROCESSING` delivery dead-letters instead of risking a second SMTP send.

## Endpoints

- `GET /api/v1/notifications?page=1&pageSize=20&unreadOnly=false` returns only the signed-in user's in-app-enabled rows that still have current project assignment, plus an unread count and bounded pagination.
- `POST /api/v1/notifications/{notificationId}/read` requires CSRF and marks only an own currently authorized row.
- `GET /api/v1/notification-preferences` returns `READINESS_ALERT` and `READINESS_REMINDER`; absent rows use in-app enabled/email disabled/version 1 defaults.
- `PUT /api/v1/notification-preferences/{type}` accepts only `inAppEnabled`, `emailEnabled`, and `expectedVersion`, requires CSRF, serializes concurrent creation/update, and writes redacted audit evidence.

Clients cannot select recipient/user, project, event, email address, message text, action URL, read owner, or delivery state.

## Retry and operations

Outbox and email delivery attempts are capped at five with exponential delay. Terminal failures retain error classification and UTC dead-letter time. SMTP-disabled email preferences are retained but their delivery is explicitly `SKIPPED`; in-app behavior is unaffected. Queue logs report event ID, attempt, duration and counts without recipient addresses or content, plus periodic pending/processing/dead-letter totals.

Controlled recovery requires resolving the cause first, then resetting the exact retained dead-letter event/delivery under an approved operator procedure. Automatic replay of ambiguous SMTP sends is prohibited.
