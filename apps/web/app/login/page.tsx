import { apiBaseUrl } from "../lib/api";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error;
  return (
    <main className="centered-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">PT Meco Inoxprima</p>
        <h1 id="login-title">Sign in to MECO Flow</h1>
        <p>
          Use your managed organization identity. Passwords are never stored by
          MECO Flow.
        </p>
        {error ? (
          <p className="error" role="alert">
            Authentication could not be completed. Please try again.
          </p>
        ) : null}
        <a className="button" href={`${apiBaseUrl}/api/v1/auth/login`}>
          Continue to identity provider
        </a>
      </section>
    </main>
  );
}
