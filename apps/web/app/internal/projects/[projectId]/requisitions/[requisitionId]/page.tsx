import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../../lib/api";
import {
  approveRequisition,
  cancelRequisition,
  rejectRequisition,
  submitRequisition,
} from "../actions";
import { requisitionDetail } from "../data";

export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; requisitionId: string }>;
}) {
  const { projectId, requisitionId } = await params;
  if (
    ![projectId, requisitionId].every((value) => /^[0-9a-f-]{36}$/i.test(value))
  )
    notFound();
  const [me, requisition] = await Promise.all([
    requireMe("INTERNAL"),
    requisitionDetail(requisitionId),
  ]);
  if (requisition.project.id !== projectId) notFound();
  const permissions = new Set(
    me.memberships.flatMap((membership) => membership.permissions),
  );
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/requisitions`}>
          Purchase requisitions
        </Link>
        <span aria-hidden="true">/</span>
        <span>PR-{String(requisition.requisitionNumber).padStart(4, "0")}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">
            PR-{String(requisition.requisitionNumber).padStart(4, "0")}
          </p>
          <h1>{requisition.title}</h1>
          <p className="lede">
            Requested by {requisition.requester.displayName} · version{" "}
            {requisition.version}
          </p>
        </div>
        <span className={`status status--${requisition.status.toLowerCase()}`}>
          {requisition.status}
        </span>
      </div>

      <section className="summary-grid" aria-label="Requisition summary">
        <div>
          <span>Lines</span>
          <strong>{requisition.lines.length}</strong>
        </div>
        <div>
          <span>Requester</span>
          <strong>{requisition.requester.displayName}</strong>
        </div>
        <div>
          <span>Approver</span>
          <strong>{requisition.approver?.displayName ?? "Not approved"}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{requisition.status}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Workflow</h2>
        {requisition.status === "DRAFT" &&
        permissions.has("requisition.submit") ? (
          <CommandForm
            action={submitRequisition}
            button="Submit requisition"
            projectId={projectId}
            requisitionId={requisition.id}
            version={requisition.version}
          />
        ) : null}
        {requisition.status === "SUBMITTED" &&
        permissions.has("requisition.approve") ? (
          <>
            <CommandForm
              action={approveRequisition}
              button="Approve requisition"
              projectId={projectId}
              requisitionId={requisition.id}
              version={requisition.version}
            />
            <CommandForm
              action={rejectRequisition}
              button="Reject requisition"
              projectId={projectId}
              requisitionId={requisition.id}
              version={requisition.version}
            />
          </>
        ) : null}
        {(["DRAFT", "SUBMITTED", "APPROVED"] as const).includes(
          requisition.status as "DRAFT" | "SUBMITTED" | "APPROVED",
        ) && permissions.has("requisition.cancel") ? (
          <CommandForm
            action={cancelRequisition}
            button="Cancel requisition"
            projectId={projectId}
            requisitionId={requisition.id}
            version={requisition.version}
          />
        ) : null}
        {requisition.transitions.length === 0 ? (
          <p>No transition has occurred.</p>
        ) : (
          <div className="timeline">
            {requisition.transitions.map((transition) => (
              <article key={transition.id}>
                <strong>
                  {transition.sourceStatus} → {transition.targetStatus}
                </strong>
                <span>{transition.actor.displayName}</span>
                <p>{transition.reason}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Requisition lines and outstanding need</h2>
        <p>{requisition.notes || "No requisition notes."}</p>
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Released BOM requirement</th>
              <th>Requested</th>
              <th>Need at creation</th>
              <th>Covered now</th>
              <th>Outstanding now</th>
              <th>Override</th>
            </tr>
          </thead>
          <tbody>
            {requisition.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.lineNumber}</td>
                <td>
                  {line.bomLine.item.code} — {line.bomLine.item.name}
                  <small>
                    {line.bomLine.bomRevision.bom.workPackage?.code ??
                      "Whole project"}{" "}
                    · R{line.bomLine.bomRevision.revisionNumber} line{" "}
                    {line.bomLine.lineNumber}
                  </small>
                </td>
                <td>
                  {line.quantity} {line.bomLine.unitOfMeasure.symbol}
                </td>
                <td>{line.requiredQuantitySnapshot}</td>
                <td>{line.coveredQuantity}</td>
                <td>{line.outstandingQuantity}</td>
                <td>
                  {line.overNeedOverride ? (
                    <>
                      Authorized by {line.overrideAuthorizedBy?.displayName}
                      <small>{line.overrideReason}</small>
                    </>
                  ) : (
                    "No"
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

function CommandForm({
  action,
  button,
  projectId,
  requisitionId,
  version,
}: {
  action: (formData: FormData) => Promise<void>;
  button: string;
  projectId: string;
  requisitionId: string;
  version: number;
}) {
  return (
    <form action={action} className="inline-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="requisitionId" value={requisitionId} />
      <input type="hidden" name="expectedVersion" value={version} />
      <label>
        Reason
        <input name="reason" minLength={5} maxLength={500} required />
      </label>
      <button type="submit">{button}</button>
    </form>
  );
}
