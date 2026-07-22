import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../../../lib/api";
import { confirmBomImport } from "../../actions";
import { bomImportDetail } from "../../data";

export default async function BomImportPage({
  params,
}: {
  params: Promise<{ importId: string; projectId: string }>;
}) {
  const { importId, projectId } = await params;
  if (![importId, projectId].every((value) => /^[0-9a-f-]{36}$/i.test(value)))
    notFound();
  const [me, detail] = await Promise.all([
    requireMe("INTERNAL"),
    bomImportDetail(importId),
  ]);
  const processing = ["QUEUED", "PARSING"].includes(detail.status);
  const canConfirm =
    detail.status === "READY" &&
    detail.errorCount === 0 &&
    me.memberships.some((membership) =>
      membership.permissions.includes("bom.import"),
    );
  return (
    <main className="workspace">
      {processing ? <meta httpEquiv="refresh" content="1" /> : null}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/boms`}>BOM revisions</Link>
        <span aria-hidden="true">/</span>
        <span>Import dry run</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Background validation</p>
          <h1>{detail.sourceFile.originalFileName}</h1>
          <p className="lede">SHA-256 {detail.sourceFile.sha256}</p>
        </div>
        <span className={`status status--${detail.status.toLowerCase()}`}>
          {detail.status}
        </span>
      </div>
      <section className="summary-grid" aria-label="Dry-run summary">
        <div>
          <span>Rows retained</span>
          <strong>{detail.rowCount}</strong>
        </div>
        <div>
          <span>Errors</span>
          <strong>{detail.errorCount}</strong>
        </div>
        <div>
          <span>Warnings</span>
          <strong>{detail.warningCount}</strong>
        </div>
        <div>
          <span>File state</span>
          <strong>{detail.sourceFile.status}</strong>
        </div>
      </section>

      {processing ? (
        <section className="panel">
          <h2>Parsing in progress</h2>
          <p>
            The worker is validating every row. This page refreshes
            automatically.
          </p>
        </section>
      ) : null}
      {detail.status === "FAILED" ? (
        <section className="panel error-panel">
          <h2>File rejected</h2>
          <p>{detail.failureCode}</p>
          <p>No draft BOM revision was created.</p>
        </section>
      ) : null}

      {detail.rows.length > 0 ? (
        <section className="panel">
          <h2>Row-level validation</h2>
          <p>
            Rows are never silently discarded. Correct the source file and
            upload it again when errors remain.
          </p>
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Criticality</th>
                <th>Errors and warnings</th>
              </tr>
            </thead>
            <tbody>
              {detail.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.rowNumber}</td>
                  <td>
                    {row.rawData.item_code || row.rawData.item_name || "—"}
                  </td>
                  <td>{row.rawData.quantity || "—"}</td>
                  <td>{row.rawData.unit_code || "—"}</td>
                  <td>{row.criticality ?? row.rawData.criticality ?? "—"}</td>
                  <td>
                    {row.errors.map((entry) => (
                      <p
                        className="validation-error"
                        key={`${entry.field}:${entry.code}`}
                      >
                        {entry.code}: {entry.message}
                      </p>
                    ))}
                    {row.warnings.map((entry) => (
                      <p
                        className="validation-warning"
                        key={`${entry.field}:${entry.code}`}
                      >
                        {entry.code}: {entry.message}
                      </p>
                    ))}
                    {row.errors.length + row.warnings.length === 0
                      ? "Valid"
                      : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {canConfirm ? (
        <section className="panel">
          <h2>Confirm draft creation</h2>
          <p>
            This explicit confirmation creates a new draft revision and links
            this source file and checksum.
          </p>
          <form
            action={confirmBomImport}
            aria-label="Confirm BOM import"
            className="form-grid"
          >
            <input type="hidden" name="importId" value={detail.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <input
              type="hidden"
              name="expectedVersion"
              value={detail.version}
            />
            <label>
              Revision title
              <input name="title" required minLength={2} maxLength={200} />
            </label>
            <label>
              Notes
              <input name="notes" maxLength={2000} />
            </label>
            <label className="checkbox">
              <input name="confirmed" type="checkbox" value="true" required />I
              confirm that this dry run should create a draft BOM revision.
            </label>
            <button type="submit">Create draft revision</button>
          </form>
        </section>
      ) : null}
      {detail.status === "READY" && detail.errorCount > 0 ? (
        <section className="panel">
          <h2>Correction required</h2>
          <p>
            Fix every error in the source file, then{" "}
            <Link href={`/internal/projects/${projectId}/boms`}>
              upload the corrected file
            </Link>
            . This invalid dry run remains retained for auditability.
          </p>
        </section>
      ) : null}
    </main>
  );
}
