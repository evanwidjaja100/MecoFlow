import Link from "next/link";
import { requireMe } from "../../lib/api";
import { managementReadiness } from "./data";
import { ReadinessSummary } from "./readiness-summary";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pageLink(page: number): string {
  return `/internal/readiness?page=${page}&pageSize=20`;
}

export default async function ManagementReadinessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireMe("INTERNAL");
  const raw = await searchParams;
  const page = typeof raw.page === "string" ? raw.page : "1";
  const query = new URLSearchParams({ page, pageSize: "20" });
  const snapshots = await managementReadiness(query);
  return (
    <main className="workspace">
      <p className="eyebrow">Phase 7B</p>
      <h1>Management readiness dashboard</h1>
      <p className="lede">
        Latest authorized project readiness, with every score accompanied by its
        blockers, risk reasons, and recommended actions.
      </p>
      {snapshots.data.length ? (
        <div className="readiness-grid">
          {snapshots.data.map((snapshot) => (
            <ReadinessSummary key={snapshot.id} snapshot={snapshot} />
          ))}
        </div>
      ) : (
        <section className="panel">
          <h2>No readiness snapshots yet</h2>
          <p>
            The event worker will calculate projects after a released material
            requirement exists.
          </p>
        </section>
      )}
      <nav className="pagination" aria-label="Readiness project pages">
        {snapshots.pagination.page > 1 ? (
          <Link href={pageLink(snapshots.pagination.page - 1)}>Previous</Link>
        ) : (
          <span>Previous</span>
        )}
        <span>
          Page {snapshots.pagination.page} of{" "}
          {Math.max(1, snapshots.pagination.totalPages)}
        </span>
        {snapshots.pagination.page < snapshots.pagination.totalPages ? (
          <Link href={pageLink(snapshots.pagination.page + 1)}>Next</Link>
        ) : (
          <span>Next</span>
        )}
      </nav>
    </main>
  );
}
