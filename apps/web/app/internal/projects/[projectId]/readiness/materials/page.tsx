import Link from "next/link";
import { notFound } from "next/navigation";
import { materialReadiness } from "../../../../readiness/data";
import { ReadinessSummary } from "../../../../readiness/readiness-summary";

export default async function MaterialReadinessPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const { latest, lineExplanations, lines } =
    await materialReadiness(projectId);
  const explanationByLine = new Map(
    lineExplanations.map((line) => [line.bomLineId, line]),
  );
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/readiness`}>
          Readiness
        </Link>
        <span aria-hidden="true">/</span>
        <span>Materials</span>
      </nav>
      <h1>Material-readiness board</h1>
      {latest ? (
        <ReadinessSummary compact snapshot={latest} />
      ) : (
        <section className="panel">
          <p>Calculation pending.</p>
        </section>
      )}
      <div className="readiness-grid">
        {lines.map((line) => {
          const explanation = explanationByLine.get(line.bomLineId);
          const actions =
            latest?.recommendedActions.filter(
              (action) => action.bomLineId === line.bomLineId,
            ) ?? [];
          return (
            <article className="panel" key={line.bomLineId}>
              <div className="heading-row">
                <div>
                  <p className="eyebrow">{line.criticality}</p>
                  <h2>
                    {line.itemCode} — {line.itemName}
                  </h2>
                </div>
                <span className="status">
                  {line.currentStage.replaceAll("_", " ")}
                </span>
              </div>
              <p>
                {line.workPackageCode ? `${line.workPackageCode} · ` : ""}
                Required {line.requiredDate}
              </p>
              <div
                className="summary-grid"
                aria-label={`${line.itemCode} quantities`}
              >
                <div>
                  <span>Required</span>
                  <strong>
                    {line.requiredQuantity} {line.unitSymbol}
                  </strong>
                </div>
                <div>
                  <span>Accepted</span>
                  <strong>{line.acceptedQuantity}</strong>
                </div>
                <div>
                  <span>Allocated</span>
                  <strong>{line.allocatedQuantity}</strong>
                </div>
                <div>
                  <span>Shortage</span>
                  <strong>{line.shortage}</strong>
                </div>
              </div>
              <p>
                Requisitioned {line.requisitionedQuantity} · ordered{" "}
                {line.orderedQuantity} · confirmed {line.confirmedQuantity} ·
                shipped {line.shippedQuantity} · received{" "}
                {line.receivedQuantity} · certificate complete{" "}
                {line.certificateCompleteQuantity}
              </p>
              <h3>Blockers and reasons</h3>
              {explanation &&
              (explanation.blockerCodes.length ||
                explanation.reasonCodes.length) ? (
                <ul>
                  {[
                    ...explanation.blockerCodes,
                    ...explanation.reasonCodes,
                  ].map((code) => (
                    <li key={code}>{code.replaceAll("_", " ")}</li>
                  ))}
                </ul>
              ) : (
                <p>None.</p>
              )}
              <h3>Recommended actions</h3>
              {actions.length ? (
                <ul>
                  {actions.map((action) => (
                    <li key={action.code}>{action.action}</li>
                  ))}
                </ul>
              ) : (
                <p>None.</p>
              )}
              <p className="hint">
                Stage score {explanation?.stageScore ?? 0}; weighted points{" "}
                {explanation?.weightedPoints ?? 0}.
              </p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
