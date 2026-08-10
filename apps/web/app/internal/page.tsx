import { requireMe } from "../lib/api";

export default async function InternalHomePage() {
  const me = await requireMe("INTERNAL");
  return (
    <main className="workspace">
      <p className="eyebrow">Phase 3B</p>
      <h1>Internal overview</h1>
      <p className="lede">
        Project delivery, the governed item master, and revision-controlled BOM
        imports are active.
      </p>
      <section className="panel">
        <h2>Active organization</h2>
        <p>{me.memberships[0]?.organization.name}</p>
      </section>
      {me.memberships.some((membership) =>
        membership.permissions.includes("readiness.read"),
      ) ? (
        <section className="panel">
          <h2>Management readiness</h2>
          <p>
            <a href="/internal/readiness">
              Review weighted readiness, critical gates, blockers, and actions
            </a>
          </p>
        </section>
      ) : null}
      <section className="panel">
        <h2>Project workspace</h2>
        <p>
          <a href="/internal/projects">Open the authorized project directory</a>
        </p>
      </section>
      {me.memberships.some((membership) =>
        membership.permissions.includes("item.read"),
      ) ? (
        <section className="panel">
          <h2>Item master</h2>
          <p>
            <a href="/internal/items">
              Search items, specifications, and units of measure
            </a>
          </p>
        </section>
      ) : null}
    </main>
  );
}
