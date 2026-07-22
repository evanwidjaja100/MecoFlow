export default function SupplierHomePage() {
  return (
    <main className="workspace">
      <p className="eyebrow">Supplier portal</p>
      <h1>Supplier overview</h1>
      <p className="lede">
        Your organization scope is active. Review addressed purchase orders,
        acknowledge revisions, and append delivery commitments.
      </p>
      <section className="panel">
        <h2>Secure collaboration</h2>
        <p>
          Only records explicitly shared with your supplier organization will
          appear here.
        </p>
      </section>
      <section className="panel">
        <h2>Purchase orders</h2>
        <p>Commercial fields marked internal are filtered by the server.</p>
        <a className="button" href="/supplier/purchase-orders">
          Open purchase orders
        </a>
      </section>
    </main>
  );
}
