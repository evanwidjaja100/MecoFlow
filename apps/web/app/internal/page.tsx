import { requireMe } from "../lib/api";

export default async function InternalHomePage() {
  const me = await requireMe("INTERNAL");
  return (
    <main className="workspace">
      <p className="eyebrow">Phase 1</p>
      <h1>Internal overview</h1>
      <p className="lede">
        Identity and authorization are active. Operational project functions
        begin in Phase 2.
      </p>
      <section className="panel">
        <h2>Active organization</h2>
        <p>{me.memberships[0]?.organization.name}</p>
      </section>
    </main>
  );
}
