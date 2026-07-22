import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../lib/api";
import { projectOverview } from "../../data";
import { createRequisition } from "./actions";
import { requisitionWorkspace } from "./data";

export default async function RequisitionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const [me, project, workspace] = await Promise.all([
    requireMe("INTERNAL"),
    projectOverview(projectId),
    requisitionWorkspace(projectId),
  ]);
  const permissions = new Set(
    me.memberships.flatMap((membership) => membership.permissions),
  );
  const canWrite = permissions.has("requisition.write");
  const canOverride = permissions.has("requisition.override");
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/internal/projects/${project.id}`}>{project.code}</Link>
        <span aria-hidden="true">/</span>
        <span>Purchase requisitions</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Phase 4A</p>
          <h1>Purchase requisitions</h1>
          <p className="lede">
            {project.name} · released BOM need and requisition coverage.
          </p>
        </div>
        <span className="badge">
          {workspace.requisitions.length} requisitions
        </span>
      </div>

      {canWrite ? (
        <section className="panel">
          <h2>Create from released BOM requirements</h2>
          <p>
            Select one or more released lines. Active draft, submitted, and
            approved requisitions already count as coverage.
          </p>
          {workspace.requirements.length === 0 ? (
            <p>No released BOM requirement is available.</p>
          ) : (
            <form action={createRequisition} className="stack">
              <input type="hidden" name="projectId" value={projectId} />
              <div className="form-grid">
                <label>
                  Title
                  <input name="title" minLength={2} maxLength={200} required />
                </label>
                <label>
                  Notes
                  <input name="notes" maxLength={2000} />
                </label>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Requirement</th>
                    <th>Need</th>
                    <th>Covered</th>
                    <th>Outstanding</th>
                    <th>Requisition quantity</th>
                    {canOverride ? <th>Override reason</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {workspace.requirements.map((requirement) => (
                    <tr key={requirement.bomLineId}>
                      <td>
                        <input
                          aria-label={`Select ${requirement.item.code}`}
                          name="bomLineId"
                          type="checkbox"
                          value={requirement.bomLineId}
                        />
                      </td>
                      <td>
                        {requirement.item.code} — {requirement.item.name}
                        <small>
                          {requirement.workPackage?.code ?? "Whole project"} · R
                          {requirement.bomRevision.revisionNumber} line{" "}
                          {requirement.lineNumber}
                        </small>
                      </td>
                      <td>
                        {requirement.requiredQuantity}{" "}
                        {requirement.unitOfMeasure.symbol}
                      </td>
                      <td>{requirement.coveredQuantity}</td>
                      <td>{requirement.outstandingQuantity}</td>
                      <td>
                        <input
                          aria-label={`Quantity for ${requirement.item.code}`}
                          defaultValue={requirement.outstandingQuantity}
                          inputMode="decimal"
                          name={`quantity-${requirement.bomLineId}`}
                          required
                        />
                      </td>
                      {canOverride ? (
                        <td>
                          <input
                            aria-label={`Override reason for ${requirement.item.code}`}
                            name={`override-${requirement.bomLineId}`}
                            minLength={5}
                            maxLength={500}
                            placeholder="Required only above need"
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="submit">Create draft requisition</button>
            </form>
          )}
        </section>
      ) : null}

      <section className="panel">
        <h2>Requisition register</h2>
        {workspace.requisitions.length === 0 ? (
          <p>No purchase requisition has been created for this project.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Title</th>
                <th>Status</th>
                <th>Requester</th>
                <th>Approver</th>
                <th>Lines</th>
              </tr>
            </thead>
            <tbody>
              {workspace.requisitions.map((requisition) => (
                <tr key={requisition.id}>
                  <td>
                    <Link
                      href={`/internal/projects/${projectId}/requisitions/${requisition.id}`}
                    >
                      PR-
                      {String(requisition.requisitionNumber).padStart(4, "0")}
                    </Link>
                  </td>
                  <td>{requisition.title}</td>
                  <td>
                    <span
                      className={`status status--${requisition.status.toLowerCase()}`}
                    >
                      {requisition.status}
                    </span>
                  </td>
                  <td>{requisition.requester.displayName}</td>
                  <td>{requisition.approver?.displayName ?? "—"}</td>
                  <td>{requisition._count.lines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
