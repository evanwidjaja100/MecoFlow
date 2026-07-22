import Link from "next/link";
import { notFound } from "next/navigation";
import { bomComparison } from "../data";

export default async function CompareBomPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { projectId } = await params;
  const query = await searchParams;
  const bomId = typeof query.bomId === "string" ? query.bomId : "";
  const from = typeof query.from === "string" ? query.from : "";
  const to = typeof query.to === "string" ? query.to : "";
  if (
    ![projectId, bomId, from, to].every((value) =>
      /^[0-9a-f-]{36}$/i.test(value),
    )
  )
    notFound();
  const comparison = await bomComparison(bomId, from, to);
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/boms`}>BOM revisions</Link>
        <span aria-hidden="true">/</span>
        <span>Comparison</span>
      </nav>
      <p className="eyebrow">Revision comparison</p>
      <h1>
        R{comparison.from.revisionNumber} → R{comparison.to.revisionNumber}
      </h1>
      <section className="summary-grid" aria-label="Comparison summary">
        <div>
          <span>Added</span>
          <strong>{comparison.summary.added}</strong>
        </div>
        <div>
          <span>Changed</span>
          <strong>{comparison.summary.changed}</strong>
        </div>
        <div>
          <span>Removed</span>
          <strong>{comparison.summary.removed}</strong>
        </div>
        <div>
          <span>Unchanged</span>
          <strong>{comparison.summary.unchanged}</strong>
        </div>
      </section>
      <section className="panel">
        <h2>Line changes</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Change</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {comparison.changes.map((change, index) => (
              <tr key={`${change.item.id}:${index}`}>
                <td>
                  {change.item.code}
                  <small>{change.item.name}</small>
                </td>
                <td>{change.kind}</td>
                <td>
                  {change.before
                    ? `${change.before.quantity} ${change.before.unitCode} · ${change.before.criticality}`
                    : "—"}
                </td>
                <td>
                  {change.after
                    ? `${change.after.quantity} ${change.after.unitCode} · ${change.after.criticality}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
