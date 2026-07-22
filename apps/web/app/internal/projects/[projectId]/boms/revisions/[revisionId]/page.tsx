import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../../../lib/api";
import {
  cancelBomRevision,
  correctBomLine,
  releaseBomRevision,
  reviewBomRevision,
  supersedeBomRevision,
} from "../../actions";
import { bomRevisionDetail } from "../../data";

export default async function BomRevisionPage({
  params,
}: {
  params: Promise<{ projectId: string; revisionId: string }>;
}) {
  const { projectId, revisionId } = await params;
  if (![projectId, revisionId].every((value) => /^[0-9a-f-]{36}$/i.test(value)))
    notFound();
  const [me, revision] = await Promise.all([
    requireMe("INTERNAL"),
    bomRevisionDetail(revisionId),
  ]);
  const permissions = new Set(
    me.memberships.flatMap((membership) => membership.permissions),
  );
  const canWrite = revision.status === "DRAFT" && permissions.has("bom.write");
  const canReview = permissions.has("bom.review");
  const canRelease = permissions.has("bom.release");
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/boms`}>BOM revisions</Link>
        <span aria-hidden="true">/</span>
        <span>R{revision.revisionNumber}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">
            {revision.bom.workPackage?.code ?? "Whole project"}
          </p>
          <h1>{revision.title}</h1>
          <p className="lede">
            Revision R{revision.revisionNumber} · created by{" "}
            {revision.createdBy.displayName}
          </p>
        </div>
        <span className={`status status--${revision.status.toLowerCase()}`}>
          {revision.status.replace("_", " ")}
        </span>
      </div>

      <section className="summary-grid" aria-label="Revision summary">
        <div>
          <span>Lines</span>
          <strong>{revision.lines.length}</strong>
        </div>
        <div>
          <span>Official readiness</span>
          <strong>
            {revision.status === "RELEASED" ? "Included" : "Excluded"}
          </strong>
        </div>
        <div>
          <span>Source file</span>
          <strong>{revision.sourceFile?.originalFileName ?? "None"}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{revision.version}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Source and integrity</h2>
        <p>{revision.notes || "No revision notes."}</p>
        {revision.sourceFile ? (
          <dl className="definition-list">
            <div>
              <dt>Private source</dt>
              <dd>{revision.sourceFile.originalFileName}</dd>
            </div>
            <div>
              <dt>SHA-256</dt>
              <dd className="checksum">{revision.sourceChecksum}</dd>
            </div>
            <div>
              <dt>Validation state</dt>
              <dd>{revision.sourceFile.status}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="panel">
        <h2>Revision lifecycle</h2>
        {revision.status === "DRAFT" && canReview ? (
          <LifecycleForm
            action={reviewBomRevision}
            button="Submit for review"
            projectId={projectId}
            revisionId={revision.id}
            version={revision.version}
          />
        ) : null}
        {revision.status === "IN_REVIEW" && canRelease ? (
          <LifecycleForm
            action={releaseBomRevision}
            button="Release revision"
            projectId={projectId}
            revisionId={revision.id}
            version={revision.version}
          />
        ) : null}
        {["DRAFT", "IN_REVIEW"].includes(revision.status) && canReview ? (
          <LifecycleForm
            action={cancelBomRevision}
            button="Cancel revision"
            projectId={projectId}
            revisionId={revision.id}
            version={revision.version}
          />
        ) : null}
        {revision.status === "RELEASED" && canRelease ? (
          <LifecycleForm
            action={supersedeBomRevision}
            button="Supersede revision"
            projectId={projectId}
            revisionId={revision.id}
            version={revision.version}
          />
        ) : null}
        {revision.transitions.length === 0 ? (
          <p>No lifecycle transition has occurred.</p>
        ) : (
          <div className="timeline">
            {revision.transitions.map((transition) => (
              <article key={transition.id}>
                <strong>
                  {transition.sourceStatus.replace("_", " ")} →{" "}
                  {transition.targetStatus.replace("_", " ")}
                </strong>
                <span>{transition.actor.displayName}</span>
                <p>{transition.reason}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>BOM lines</h2>
        <p>
          Only lines in a RELEASED revision affect official readiness.
          Procurement coverage is a Phase 3 placeholder and creates no
          requisition, order, allocation, or other purchasing data.
        </p>
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Criticality</th>
              <th>Coverage</th>
              <th>Correction</th>
            </tr>
          </thead>
          <tbody>
            {revision.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.lineNumber}</td>
                <td>
                  {line.item.code}
                  <small>{line.item.name}</small>
                </td>
                <td>
                  {line.quantity} {line.unitOfMeasure.symbol}
                </td>
                <td>{line.criticality}</td>
                <td>
                  {line.procurementCoverage.status}
                  <small>Placeholder · ordered 0 · allocated 0</small>
                </td>
                <td>
                  {canWrite ? (
                    <details>
                      <summary>Correct line</summary>
                      <form
                        action={correctBomLine}
                        aria-label={`Correct BOM line ${line.lineNumber}`}
                        className="form-grid"
                      >
                        <input
                          type="hidden"
                          name="projectId"
                          value={projectId}
                        />
                        <input
                          type="hidden"
                          name="revisionId"
                          value={revision.id}
                        />
                        <input type="hidden" name="lineId" value={line.id} />
                        <input
                          type="hidden"
                          name="expectedVersion"
                          value={line.version}
                        />
                        <input
                          type="hidden"
                          name="unitOfMeasureId"
                          value={line.unitOfMeasureId}
                        />
                        <label>
                          Quantity
                          <input
                            name="quantity"
                            defaultValue={line.quantity}
                            inputMode="decimal"
                            required
                          />
                        </label>
                        <label>
                          Criticality
                          <select
                            name="criticality"
                            defaultValue={line.criticality}
                          >
                            {["CRITICAL", "HIGH", "NORMAL", "LOW"].map(
                              (value) => (
                                <option key={value}>{value}</option>
                              ),
                            )}
                          </select>
                        </label>
                        <label>
                          Notes
                          <input
                            name="notes"
                            defaultValue={line.notes}
                            maxLength={1000}
                          />
                        </label>
                        <button type="submit">Save correction</button>
                      </form>
                    </details>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function LifecycleForm({
  action,
  button,
  projectId,
  revisionId,
  version,
}: {
  action: (formData: FormData) => Promise<void>;
  button: string;
  projectId: string;
  revisionId: string;
  version: number;
}) {
  return (
    <form action={action} aria-label={button} className="inline-lifecycle-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="revisionId" value={revisionId} />
      <input type="hidden" name="expectedVersion" value={version} />
      <label>
        Reason
        <input name="reason" required minLength={5} maxLength={500} />
      </label>
      <button type="submit">{button}</button>
    </form>
  );
}
