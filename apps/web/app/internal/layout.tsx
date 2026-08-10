import type { ReactNode } from "react";
import { requireMe } from "../lib/api";

export default async function InternalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const me = await requireMe("INTERNAL");
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/internal">
          MECO Flow
        </a>
        <p className="shell-label">Internal application</p>
        <nav aria-label="Internal navigation">
          <a href="/internal">Overview</a>
          <a href="/internal/projects">Projects</a>
          <a href="/internal/notifications">Notifications</a>
          {me.memberships.some((membership) =>
            membership.permissions.includes("readiness.read"),
          ) ? (
            <a href="/internal/readiness">Readiness</a>
          ) : null}
          {me.memberships.some((membership) =>
            membership.permissions.includes("report.read"),
          ) ? (
            <a href="/internal/reports">Reports</a>
          ) : null}
          {me.memberships.some((membership) =>
            membership.permissions.includes("item.read"),
          ) ? (
            <a href="/internal/items">Items</a>
          ) : null}
          <a href="/internal/administration">Administration</a>
        </nav>
      </aside>
      <div className="shell-content">
        <header className="topbar">
          <div>
            <strong>{me.user.displayName}</strong>
            <span>{me.user.email}</span>
          </div>
          <span className="badge">Internal</span>
        </header>
        {children}
      </div>
    </div>
  );
}
