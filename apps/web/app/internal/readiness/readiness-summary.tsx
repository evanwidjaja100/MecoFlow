import Link from "next/link";
import type { ReadinessSnapshot } from "./data";

export function ReadinessSummary({
  compact = false,
  snapshot,
}: {
  compact?: boolean;
  snapshot: ReadinessSnapshot;
}) {
  const title = snapshot.workPackage
    ? `${snapshot.workPackage.code} — ${snapshot.workPackage.name}`
    : `${snapshot.project.code} — ${snapshot.project.name}`;
  return (
    <article className="panel readiness-summary">
      <div className="heading-row">
        <div>
          <p className="eyebrow">{snapshot.scopeType.replace("_", " ")}</p>
          <h2>{title}</h2>
        </div>
        <span className={`status status--${snapshot.status.toLowerCase()}`}>
          {snapshot.status}
        </span>
      </div>
      <div className="summary-grid" aria-label={`${title} readiness summary`}>
        <div>
          <span>Weighted score</span>
          <strong>{snapshot.score.toFixed(2)}%</strong>
        </div>
        <div>
          <span>Critical ready</span>
          <strong>
            {snapshot.readyCriticalLineCount}/{snapshot.criticalLineCount}
          </strong>
        </div>
        <div>
          <span>Blockers</span>
          <strong>{snapshot.blockerCount}</strong>
        </div>
        <div>
          <span>Calculated</span>
          <strong>{snapshot.calculationDate}</strong>
        </div>
      </div>
      <p>{snapshot.explanation}</p>
      <div className="readiness-explanations">
        <section aria-label={`${title} blockers`}>
          <h3>Blockers</h3>
          {snapshot.blockers.length ? (
            <ul>
              {snapshot.blockers.map((blocker, index) => (
                <li
                  key={`${blocker.bomLineId ?? "scope"}-${blocker.code}-${index}`}
                >
                  <strong>{blocker.code.replaceAll("_", " ")}</strong>:{" "}
                  {blocker.explanation}
                </li>
              ))}
            </ul>
          ) : (
            <p>None.</p>
          )}
        </section>
        <section aria-label={`${title} risk reasons`}>
          <h3>Risk reasons</h3>
          {snapshot.reasonCodes.length ? (
            <ul>
              {snapshot.reasonCodes.map((reason) => (
                <li key={reason}>{reason.replaceAll("_", " ")}</li>
              ))}
            </ul>
          ) : (
            <p>None.</p>
          )}
        </section>
        <section aria-label={`${title} recommended actions`}>
          <h3>Recommended actions</h3>
          {snapshot.recommendedActions.length ? (
            <ul>
              {snapshot.recommendedActions.map((action, index) => (
                <li
                  key={`${action.bomLineId ?? "scope"}-${action.code}-${index}`}
                >
                  <strong>{action.code.replaceAll("_", " ")}</strong>:{" "}
                  {action.action}
                </li>
              ))}
            </ul>
          ) : (
            <p>None.</p>
          )}
        </section>
      </div>
      {!compact && snapshot.scopeType === "PROJECT" ? (
        <p className="action-row">
          <Link
            href={`/internal/projects/${snapshot.project.id}/readiness/materials`}
          >
            Material board
          </Link>
          <Link
            href={`/internal/projects/${snapshot.project.id}/readiness/history`}
          >
            Readiness history
          </Link>
        </p>
      ) : null}
      <p className="hint">
        {snapshot.calculatorVersion} · {snapshot.ruleVersion} ·{" "}
        {snapshot.trigger.toLowerCase()}
      </p>
    </article>
  );
}
