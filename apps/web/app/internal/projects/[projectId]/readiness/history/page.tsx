import Link from "next/link";
import { notFound } from "next/navigation";
import { readinessHistory } from "../../../../readiness/data";
import { ReadinessSummary } from "../../../../readiness/readiness-summary";

export default async function ReadinessHistoryPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const snapshots = await readinessHistory(projectId);
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/readiness`}>
          Readiness
        </Link>
        <span aria-hidden="true">/</span>
        <span>History</span>
      </nav>
      <h1>Readiness history</h1>
      <p className="lede">
        Immutable project and work-package calculations, including their
        versions and complete explanation sets.
      </p>
      <div className="readiness-grid">
        {snapshots.map((snapshot) => (
          <ReadinessSummary compact key={snapshot.id} snapshot={snapshot} />
        ))}
      </div>
    </main>
  );
}
