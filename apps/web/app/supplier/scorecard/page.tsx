import Link from "next/link";
import { requireMe } from "../../lib/api";
import { ownScorecard, type RateMetric } from "./data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const metrics = {
  requiredDateDeliveryRate: "Required-date delivery",
  originalCommitmentOnTimeRate: "Original commitment on-time",
  latestCommitmentOnTimeRate: "Latest commitment on-time",
  commitmentRevisionRate: "Commitment revision",
  firstPassAcceptanceRate: "First-pass acceptance",
  usableAcceptanceRate: "Usable acceptance",
  ncrResponseRate: "NCR response",
} as const;

function display(metric: RateMetric): string {
  return metric.percentage === null
    ? "No eligible data"
    : `${metric.percentage.toFixed(2)}%`;
}

function defaultPeriod() {
  const now = new Date();
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
      .toISOString()
      .slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default async function SupplierScorecardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireMe("SUPPLIER");
  const raw = await searchParams;
  const defaults = defaultPeriod();
  const query = new URLSearchParams({
    from: typeof raw.from === "string" ? raw.from : defaults.from,
    to: typeof raw.to === "string" ? raw.to : defaults.to,
  });
  if (typeof raw.projectId === "string" && raw.projectId)
    query.set("projectId", raw.projectId);
  const scorecard = await ownScorecard(query);

  return (
    <main className="workspace">
      <p className="eyebrow">Phase 8B</p>
      <div className="heading-row">
        <div>
          <h1>Supplier scorecard</h1>
          <p className="lede">
            Your organization&apos;s delivery, commitment, quality, and NCR
            response performance. Other suppliers and internal evaluation data
            are never included.
          </p>
        </div>
        <span className="badge badge--supplier">{scorecard.supplier.code}</span>
      </div>

      <section className="panel">
        <h2>Reporting period</h2>
        <form action="/supplier/scorecard" className="form-grid" method="get">
          <label>
            From
            <input
              defaultValue={query.get("from") ?? ""}
              name="from"
              required
              type="date"
            />
          </label>
          <label>
            To
            <input
              defaultValue={query.get("to") ?? ""}
              name="to"
              required
              type="date"
            />
          </label>
          <label>
            Assigned project ID
            <input
              defaultValue={query.get("projectId") ?? ""}
              name="projectId"
              pattern="[0-9a-fA-F-]{36}"
            />
          </label>
          <button type="submit">Apply period</button>
          <Link className="button button--secondary" href="/supplier/scorecard">
            Clear
          </Link>
        </form>
        <div className="action-row">
          <a
            className="button button--secondary"
            href={`/supplier/scorecard/export/csv?${query}`}
          >
            Export CSV
          </a>
          <a
            className="button button--secondary"
            href={`/supplier/scorecard/export/xlsx?${query}`}
          >
            Export XLSX
          </a>
        </div>
      </section>

      <section className="panel">
        <h2>{scorecard.supplier.name}</h2>
        <div className="kpi-grid">
          {Object.entries(metrics).map(([key, label]) => {
            const metric = scorecard.kpis[key as keyof typeof metrics];
            return (
              <div key={key}>
                <span>{label}</span>
                <strong>{display(metric)}</strong>
                <small>
                  {metric.numerator} / {metric.denominator}{" "}
                  {metric.unit.toLowerCase()}
                </small>
              </div>
            );
          })}
        </div>
        <p>
          Original commitment performance uses the first retained commitment;
          latest commitment performance uses the highest retained revision. No
          composite grade is assigned.
        </p>
      </section>

      <section className="panel">
        <h2>Monthly trends</h2>
        <div
          aria-label="Monthly supplier scorecard trend chart"
          className="trend-chart"
          role="img"
        >
          {scorecard.trends.map((trend) => (
            <div className="trend-group" key={trend.month}>
              <span>{trend.month}</span>
              <div
                aria-label={`Original commitment ${display(
                  trend.kpis.originalCommitmentOnTimeRate,
                )}`}
                className="trend-bar trend-bar--originalCommitmentOnTimeRate"
                style={{
                  width: `${trend.kpis.originalCommitmentOnTimeRate.percentage ?? 0}%`,
                }}
              />
              <div
                aria-label={`Latest commitment ${display(
                  trend.kpis.latestCommitmentOnTimeRate,
                )}`}
                className="trend-bar trend-bar--latestCommitmentOnTimeRate"
                style={{
                  width: `${trend.kpis.latestCommitmentOnTimeRate.percentage ?? 0}%`,
                }}
              />
              <div
                aria-label={`Usable acceptance ${display(
                  trend.kpis.usableAcceptanceRate,
                )}`}
                className="trend-bar trend-bar--usableAcceptanceRate"
                style={{
                  width: `${trend.kpis.usableAcceptanceRate.percentage ?? 0}%`,
                }}
              />
            </div>
          ))}
        </div>
        <table>
          <caption>Monthly supplier KPI trend data</caption>
          <thead>
            <tr>
              <th>Month</th>
              <th>Required date</th>
              <th>Original commitment</th>
              <th>Latest commitment</th>
              <th>First pass</th>
              <th>Usable acceptance</th>
              <th>NCR response</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.trends.map((trend) => (
              <tr key={trend.month}>
                <td>{trend.month}</td>
                <td>{display(trend.kpis.requiredDateDeliveryRate)}</td>
                <td>{display(trend.kpis.originalCommitmentOnTimeRate)}</td>
                <td>{display(trend.kpis.latestCommitmentOnTimeRate)}</td>
                <td>{display(trend.kpis.firstPassAcceptanceRate)}</td>
                <td>{display(trend.kpis.usableAcceptanceRate)}</td>
                <td>{display(trend.kpis.ncrResponseRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
