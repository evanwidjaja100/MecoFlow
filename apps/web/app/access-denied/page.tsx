export default function AccessDeniedPage() {
  return (
    <main className="centered-page">
      <section className="login-card">
        <p className="eyebrow">Secure boundary</p>
        <h1>Access denied</h1>
        <p>Your active identity does not have permission for this area.</p>
        <a className="button button--secondary" href="/">
          Return to your application
        </a>
      </section>
    </main>
  );
}
