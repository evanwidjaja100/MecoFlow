import Link from "next/link";
import { notFound } from "next/navigation";
import { projectReadiness } from "../../../readiness/data";
import { ReadinessSummary } from "../../../readiness/readiness-summary";

export default async function ProjectReadinessPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const { latest, workPackages } = await projectReadiness(projectId);
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/internal/projects/${projectId}`}>Project</Link>
        <span aria-hidden="true">/</span>
        <span>Readiness</span>
      </nav>
      <p className="eyebrow">Phase 7B</p>
      <h1>Project-readiness overview</h1>
      {latest ? (
        <>
          <ReadinessSummary snapshot={latest} />
          <h2>Work-package readiness</h2>
          {workPackages.length ? (
            <div className="readiness-grid">
              {workPackages.map((snapshot) => (
                <ReadinessSummary
                  compact
                  key={snapshot.id}
                  snapshot={snapshot}
                />
              ))}
            </div>
          ) : (
            <section className="panel">
              <p>
                No released work-package requirements are present in this
                snapshot.
              </p>
            </section>
          )}
        </>
      ) : (
        <section className="panel">
          <h2>Calculation pending</h2>
          <p>No persisted readiness snapshot exists yet.</p>
        </section>
      )}
    </main>
  );
}
