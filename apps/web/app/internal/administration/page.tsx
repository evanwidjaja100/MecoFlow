export default function AdministrationHomePage() {
  return (
    <main className="workspace">
      <p className="eyebrow">Internal administration</p>
      <h1>Administration</h1>
      <p className="lede">
        Manage organization identity scope and role grants. Every membership and
        role change is audited.
      </p>
      <div className="card-grid">
        <a className="nav-card" href="/internal/administration/organizations">
          <h2>Organizations</h2>
          <p>Review and create internal or supplier organizations.</p>
        </a>
        <a className="nav-card" href="/internal/administration/memberships">
          <h2>Memberships</h2>
          <p>Attach synchronized identities to an organization.</p>
        </a>
        <a className="nav-card" href="/internal/administration/roles">
          <h2>Role assignments</h2>
          <p>Grant only seeded roles valid for the organization type.</p>
        </a>
      </div>
    </main>
  );
}
