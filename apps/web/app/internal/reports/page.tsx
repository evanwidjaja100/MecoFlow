import Link from "next/link";
import { requireMe } from "../../lib/api";
import {
  materialExceptionsReport,
  projectReadinessReport,
  supplierPerformanceReport,
  type RateMetric,
  type SupplierScorecard,
} from "./data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const metricLabels = {
  commitmentRevisionRate: "Commitment revision",
  firstPassAcceptanceRate: "First-pass acceptance",
  latestCommitmentOnTimeRate: "Latest commitment",
  ncrResponseRate: "NCR response",
  originalCommitmentOnTimeRate: "Original commitment",
  requiredDateDeliveryRate: "Required-date delivery",
  usableAcceptanceRate: "Usable acceptance",
} as const;

function stringValue(
  input: Record<string, string | string[] | undefined>,
  key: string,
  fallback = "",
): string {
  return typeof input[key] === "string" ? input[key] : fallback;
}

function defaultPeriod(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
  );
  return { from: fromDate.toISOString().slice(0, 10), to };
}

function params(
  raw: Record<string, string | string[] | undefined>,
  keys: string[],
): URLSearchParams {
  const defaults = defaultPeriod();
  const result = new URLSearchParams({
    from: stringValue(raw, "from", defaults.from),
    to: stringValue(raw, "to", defaults.to),
  });
  for (const key of keys) {
    const value = stringValue(raw, key);
    if (value) result.set(key, value);
  }
  return result;
}

function percent(metric: RateMetric): string {
  return metric.percentage === null
    ? "No eligible data"
    : `${metric.percentage.toFixed(2)}%`;
}

function Scorecard({ scorecard }: { scorecard: SupplierScorecard }) {
  return (
    <article className="report-scorecard">
      <h3>
        {scorecard.supplier.code} — {scorecard.supplier.name}
      </h3>
      <div className="kpi-grid">
        {Object.entries(metricLabels).map(([key, label]) => {
          const metric = scorecard.kpis[key as keyof typeof metricLabels];
          return (
            <div key={key}>
              <span>{label}</span>
              <strong>{percent(metric)}</strong>
              <small>
                {metric.numerator} / {metric.denominator}{" "}
                {metric.unit.toLowerCase()}
              </small>
            </div>
          );
        })}
      </div>
      <h4>Monthly trends</h4>
      <div
        aria-label={`${scorecard.supplier.name} monthly KPI trends`}
        className="trend-chart"
        role="img"
      >
        {scorecard.trends.map((trend) => (
          <div className="trend-group" key={trend.month}>
            <span>{trend.month}</span>
            {(
              [
                "originalCommitmentOnTimeRate",
                "latestCommitmentOnTimeRate",
                "usableAcceptanceRate",
              ] as const
            ).map((key) => (
              <div
                aria-label={`${metricLabels[key]} ${percent(trend.kpis[key])}`}
                className={`trend-bar trend-bar--${key}`}
                key={key}
                style={{ width: `${trend.kpis[key].percentage ?? 0}%` }}
                title={`${metricLabels[key]}: ${percent(trend.kpis[key])}`}
              />
            ))}
          </div>
        ))}
      </div>
      <table>
        <caption>Accessible monthly supplier KPI trend data</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Required date</th>
            <th>Original commitment</th>
            <th>Latest commitment</th>
            <th>Usable acceptance</th>
            <th>NCR response</th>
          </tr>
        </thead>
        <tbody>
          {scorecard.trends.map((trend) => (
            <tr key={trend.month}>
              <td>{trend.month}</td>
              <td>{percent(trend.kpis.requiredDateDeliveryRate)}</td>
              <td>{percent(trend.kpis.originalCommitmentOnTimeRate)}</td>
              <td>{percent(trend.kpis.latestCommitmentOnTimeRate)}</td>
              <td>{percent(trend.kpis.usableAcceptanceRate)}</td>
              <td>{percent(trend.kpis.ncrResponseRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {scorecard.deliveryLines?.length ? (
        <details>
          <summary>
            Purchase-order line drilldown ({scorecard.deliveryLines.length})
          </summary>
          <table>
            <thead>
              <tr>
                <th>Project / PO</th>
                <th>Item</th>
                <th>Ordered</th>
                <th>Required</th>
                <th>Original commitment</th>
                <th>Latest commitment</th>
                <th>Obligation</th>
              </tr>
            </thead>
            <tbody>
              {scorecard.deliveryLines.map((line) => (
                <tr key={line.purchaseOrderLineId}>
                  <td>
                    {line.project.code} / PO-{line.purchaseOrderNumber} rev{" "}
                    {line.revisionNumber}
                  </td>
                  <td>
                    {line.item.code} — {line.item.name}
                  </td>
                  <td>{line.orderedQuantity}</td>
                  <td>{line.requiredDate}</td>
                  <td>{line.originalCommitmentDate ?? "Not committed"}</td>
                  <td>{line.latestCommitmentDate ?? "Not committed"}</td>
                  <td>
                    {line.currentAcknowledged
                      ? "Current acknowledged"
                      : "Retained physical history"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </article>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [me, raw] = await Promise.all([requireMe("INTERNAL"), searchParams]);
  const readinessParams = params(raw, ["projectId", "status"]);
  const materialParams = params(raw, [
    "projectId",
    "blockerType",
    "item",
    "itemCategoryId",
    "workPackageId",
  ]);
  const supplierParams = params(raw, ["projectId", "supplierOrganizationId"]);
  const canScorecard = me.memberships.some(
    (membership) =>
      membership.permissions.includes("scorecard.read") &&
      membership.permissions.includes("report.read"),
  );
  const [readiness, materials, suppliers] = await Promise.all([
    projectReadinessReport(readinessParams),
    materialExceptionsReport(materialParams),
    canScorecard
      ? supplierPerformanceReport(supplierParams)
      : Promise.resolve(null),
  ]);
  const canExport = me.memberships.some((membership) =>
    membership.permissions.includes("report.export"),
  );

  return (
    <main className="workspace">
      <p className="eyebrow">Phase 8B</p>
      <div className="heading-row">
        <div>
          <h1>Reports and supplier scorecards</h1>
          <p className="lede">
            Authorized operational reports generated from retained readiness,
            procurement, shipment, inspection, and NCR records.
          </p>
        </div>
        <span className="badge">
          Generated{" "}
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Jakarta",
          }).format(new Date(readiness.meta.generatedAt))}
        </span>
      </div>

      <section className="panel">
        <h2>Report period and filters</h2>
        <form action="/internal/reports" className="form-grid" method="get">
          <label>
            From
            <input
              defaultValue={readinessParams.get("from") ?? ""}
              name="from"
              required
              type="date"
            />
          </label>
          <label>
            To
            <input
              defaultValue={readinessParams.get("to") ?? ""}
              name="to"
              required
              type="date"
            />
          </label>
          <label>
            Project ID
            <input
              defaultValue={readinessParams.get("projectId") ?? ""}
              name="projectId"
              pattern="[0-9a-fA-F-]{36}"
            />
          </label>
          <label>
            Readiness status
            <select
              defaultValue={readinessParams.get("status") ?? ""}
              name="status"
            >
              <option value="">All statuses</option>
              {["RED", "AMBER", "GREEN", "COMPLETE"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          {canScorecard ? (
            <label>
              Supplier organization ID
              <input
                defaultValue={
                  supplierParams.get("supplierOrganizationId") ?? ""
                }
                name="supplierOrganizationId"
                pattern="[0-9a-fA-F-]{36}"
              />
            </label>
          ) : null}
          <button type="submit">Apply filters</button>
          <Link className="button button--secondary" href="/internal/reports">
            Clear filters
          </Link>
        </form>
      </section>

      <section className="panel">
        <div className="heading-row">
          <h2>Project readiness report</h2>
          {canExport ? (
            <div className="action-row">
              <a
                className="button button--secondary"
                href={`/internal/reports/export/project-readiness/csv?${readinessParams}`}
              >
                Export CSV
              </a>
              <a
                className="button button--secondary"
                href={`/internal/reports/export/project-readiness/xlsx?${readinessParams}`}
              >
                Export XLSX
              </a>
            </div>
          ) : null}
        </div>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Score</th>
              <th>Blockers</th>
              <th>Explanation</th>
            </tr>
          </thead>
          <tbody>
            {readiness.data.map((row) => (
              <tr key={row.project.id}>
                <td>{row.project.code}</td>
                <td>
                  <span
                    className={`status status--${row.status.toLowerCase()}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td>{row.score.toFixed(2)}</td>
                <td>{row.blockerCount}</td>
                <td>{row.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!readiness.data.length ? <p>No matching readiness records.</p> : null}
      </section>

      <section className="panel">
        <div className="heading-row">
          <h2>Material exceptions report</h2>
          {canExport ? (
            <div className="action-row">
              <a
                className="button button--secondary"
                href={`/internal/reports/export/material-exceptions/csv?${materialParams}`}
              >
                Export CSV
              </a>
              <a
                className="button button--secondary"
                href={`/internal/reports/export/material-exceptions/xlsx?${materialParams}`}
              >
                Export XLSX
              </a>
            </div>
          ) : null}
        </div>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Item</th>
              <th>Criticality</th>
              <th>Blocker</th>
              <th>Shortage</th>
              <th>Required date</th>
            </tr>
          </thead>
          <tbody>
            {materials.data.map((row) => (
              <tr key={`${row.project.id}:${row.itemCode}`}>
                <td>{row.project.code}</td>
                <td>
                  {row.itemCode} — {row.itemName}
                </td>
                <td>{row.criticality}</td>
                <td>{row.blockerReason ?? "Derived exception"}</td>
                <td>{row.shortage}</td>
                <td>{row.requiredDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!materials.data.length ? (
          <p>No matching material exceptions.</p>
        ) : null}
      </section>

      {suppliers ? (
        <section className="panel">
          <div className="heading-row">
            <h2>Supplier performance report</h2>
            {canExport ? (
              <div className="action-row">
                <a
                  className="button button--secondary"
                  href={`/internal/reports/export/supplier-performance/csv?${supplierParams}`}
                >
                  Export CSV
                </a>
                <a
                  className="button button--secondary"
                  href={`/internal/reports/export/supplier-performance/xlsx?${supplierParams}`}
                >
                  Export XLSX
                </a>
              </div>
            ) : null}
          </div>
          <div className="report-scorecards">
            {suppliers.data.map((scorecard) => (
              <Scorecard key={scorecard.supplier.id} scorecard={scorecard} />
            ))}
          </div>
          {!suppliers.data.length ? (
            <p>No supplier KPI cohorts match the selected period.</p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
