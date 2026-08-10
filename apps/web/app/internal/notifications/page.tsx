import { requireMe } from "../../lib/api";
import { markNotificationRead, updateNotificationPreference } from "./actions";
import {
  notificationPreferences,
  notifications,
  type NotificationType,
} from "./data";

const labels: Record<NotificationType, string> = {
  READINESS_ALERT: "Readiness status updates",
  READINESS_REMINDER: "Daily readiness reminders",
};

export default async function NotificationsPage() {
  await requireMe("INTERNAL");
  const [result, preferences] = await Promise.all([
    notifications(),
    notificationPreferences(),
  ]);
  return (
    <main className="workspace">
      <p className="eyebrow">Phase 8A</p>
      <div className="heading-row">
        <div>
          <h1>Notifications</h1>
          <p className="lede">
            {result.meta.unread} unread notification
            {result.meta.unread === 1 ? "" : "s"}. Delivery choices are applied
            by the server for each notification type.
          </p>
        </div>
      </div>

      <section className="panel">
        <h2>Delivery preferences</h2>
        <div className="notification-preferences">
          {preferences.map((preference) => (
            <form
              action={updateNotificationPreference}
              className="notification-preference"
              key={preference.type}
            >
              <input name="type" type="hidden" value={preference.type} />
              <input
                name="expectedVersion"
                type="hidden"
                value={preference.version}
              />
              <strong>{labels[preference.type]}</strong>
              <label className="checkbox">
                <input
                  defaultChecked={preference.inAppEnabled}
                  name="inAppEnabled"
                  type="checkbox"
                />
                In-app
              </label>
              <label className="checkbox">
                <input
                  defaultChecked={preference.emailEnabled}
                  name="emailEnabled"
                  type="checkbox"
                />
                Email
              </label>
              <button type="submit">Save preference</button>
            </form>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Inbox</h2>
        {result.data.length ? (
          <div className="notification-list">
            {result.data.map((notification) => (
              <article
                className={`notification-card ${
                  notification.readAt ? "" : "notification-card--unread"
                }`}
                key={notification.id}
              >
                <div>
                  <p className="eyebrow">{labels[notification.type]}</p>
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <small>
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Jakarta",
                    }).format(new Date(notification.createdAt))}
                  </small>
                </div>
                <div className="action-row">
                  <a className="button" href={notification.actionUrl}>
                    Review readiness
                  </a>
                  {!notification.readAt ? (
                    <form action={markNotificationRead}>
                      <input
                        name="notificationId"
                        type="hidden"
                        value={notification.id}
                      />
                      <button
                        className="button button--secondary"
                        type="submit"
                      >
                        Mark as read
                      </button>
                    </form>
                  ) : (
                    <span className="badge">Read</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No notifications have been delivered yet.</p>
        )}
      </section>
    </main>
  );
}
