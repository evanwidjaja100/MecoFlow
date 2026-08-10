import type { ReactNode } from "react";
import { requireMe } from "../lib/api";

export default async function SupplierLayout({
  children,
}: {
  children: ReactNode;
}) {
  const me = await requireMe("SUPPLIER");
  const organization = me.memberships[0]?.organization;
  return (
    <div className="app-shell app-shell--supplier">
      <aside className="sidebar sidebar--supplier">
        <a className="brand" href="/supplier">
          MECO Flow
        </a>
        <p className="shell-label">Supplier portal</p>
        <nav aria-label="Supplier navigation">
          <a href="/supplier">Overview</a>
          <a href="/supplier/purchase-orders">Purchase orders</a>
          <a href="/supplier/asns">Shipment notices</a>
          <a href="/supplier/ncrs">Nonconformance reports</a>
          {me.memberships.some((membership) =>
            membership.permissions.includes("supplier.scorecard.read"),
          ) ? (
            <a href="/supplier/scorecard">Scorecard</a>
          ) : null}
        </nav>
      </aside>
      <div className="shell-content">
        <header className="topbar">
          <div>
            <strong>{me.user.displayName}</strong>
            <span>{organization?.name}</span>
          </div>
          <span className="badge badge--supplier">Supplier</span>
        </header>
        {children}
      </div>
    </div>
  );
}
