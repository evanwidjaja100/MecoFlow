import { ApiHealthStatus } from "./api-health-status";

export default function HomePage() {
  return (
    <main>
      <header className="masthead">
        <p className="eyebrow">PT Meco Inoxprima</p>
        <h1>MECO Flow</h1>
        <p className="subtitle">
          Project material readiness, from engineering release to fabrication.
        </p>
      </header>

      <section aria-labelledby="foundation-title" className="panel">
        <div>
          <p className="phase">Phase 0</p>
          <h2 id="foundation-title">System foundation</h2>
          <p>
            The repository, application processes, infrastructure, validation,
            and health boundaries are ready for local verification. Operational
            business modules are intentionally not enabled.
          </p>
        </div>
        <ApiHealthStatus />
      </section>

      <section aria-labelledby="objective-title" className="objective">
        <h2 id="objective-title">Primary objective</h2>
        <p>
          Determine whether every critical material, with the correct
          specification and required documentation, will be available before
          fabrication begins.
        </p>
      </section>
    </main>
  );
}
