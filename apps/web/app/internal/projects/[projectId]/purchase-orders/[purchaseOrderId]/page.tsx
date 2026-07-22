import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../../lib/api";
import { cancelPurchaseOrder, sendPurchaseOrder } from "../actions";
import { purchaseOrderDetail } from "../data";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; purchaseOrderId: string }>;
}) {
  const { projectId, purchaseOrderId } = await params;
  if (
    ![projectId, purchaseOrderId].every((value) =>
      /^[0-9a-f-]{36}$/i.test(value),
    )
  )
    notFound();
  const [me, order] = await Promise.all([
    requireMe("INTERNAL"),
    purchaseOrderDetail(purchaseOrderId),
  ]);
  if (order.project.id !== projectId) notFound();
  const permissions = new Set(
    me.memberships.flatMap((membership) => membership.permissions),
  );
  const revision = order.currentRevision;

  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/purchase-orders`}>
          Purchase orders
        </Link>
        <span aria-hidden="true">/</span>
        <span>PO-{String(order.purchaseOrderNumber).padStart(4, "0")}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">
            PO-{String(order.purchaseOrderNumber).padStart(4, "0")} · R
            {revision.revisionNumber}
          </p>
          <h1>{revision.title}</h1>
          <p className="lede">
            {order.supplierOrganization.name} · {order.revisions.length}{" "}
            retained revision{order.revisions.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className={`status status--${order.status.toLowerCase()}`}>
          {order.status}
        </span>
      </div>

      <section className="summary-grid" aria-label="Purchase order summary">
        <div>
          <span>Current revision</span>
          <strong>R{revision.revisionNumber}</strong>
        </div>
        <div>
          <span>Supplier</span>
          <strong>{order.supplierOrganization.name}</strong>
        </div>
        <div>
          <span>Original send</span>
          <strong>
            {order.sentAt
              ? new Date(order.sentAt).toLocaleString()
              : "Not sent"}
          </strong>
        </div>
        <div>
          <span>Acknowledged</span>
          <strong>
            {order.acknowledgedAt
              ? new Date(order.acknowledgedAt).toLocaleString()
              : "Pending"}
          </strong>
        </div>
      </section>

      <section className="panel">
        <h2>Lifecycle</h2>
        {order.status === "DRAFT" && permissions.has("purchase-order.send") ? (
          <CommandForm
            action={sendPurchaseOrder}
            button="Send purchase order"
            orderId={order.id}
            projectId={projectId}
            version={order.version}
          />
        ) : null}
        {order.status !== "CANCELLED" &&
        permissions.has("purchase-order.cancel") ? (
          <CommandForm
            action={cancelPurchaseOrder}
            button="Cancel purchase order"
            orderId={order.id}
            projectId={projectId}
            version={order.version}
          />
        ) : null}
        <div className="timeline">
          {order.transitions.map((transition) => (
            <article key={transition.id}>
              <strong>
                {transition.sourceStatus} → {transition.targetStatus}
              </strong>
              <span>{transition.actor.displayName}</span>
              <p>{transition.reason}</p>
            </article>
          ))}
          {order.transitions.length === 0 ? (
            <p>No lifecycle transition has occurred.</p>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2>Current revision lines and commitments</h2>
        <p>{revision.supplierMessage || "No supplier message."}</p>
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Item</th>
              <th>Ordered</th>
              <th>Required</th>
              <th>Original commitment</th>
              <th>Latest commitment</th>
              <th>Internal unit price</th>
              <th>Allocation</th>
            </tr>
          </thead>
          <tbody>
            {revision.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.lineNumber}</td>
                <td>
                  {line.item.code} — {line.item.name}
                  <small>
                    {line.internalLineNotes || "No internal line note"}
                  </small>
                </td>
                <td>
                  {line.orderedQuantity} {line.unitOfMeasure.symbol}
                </td>
                <td>{line.requiredDate}</td>
                <td>{line.originalCommitmentDate ?? "Pending"}</td>
                <td>
                  {line.latestCommitmentDate ? (
                    <span
                      className={
                        line.isLate
                          ? "status status--cancelled"
                          : "status status--active"
                      }
                    >
                      {line.latestCommitmentDate}
                    </span>
                  ) : (
                    "Pending"
                  )}
                </td>
                <td>{line.internalUnitPrice ?? "—"}</td>
                <td>
                  {line.allocations.map((allocation) => (
                    <span
                      key={
                        allocation.purchaseRequisitionLine.purchaseRequisition
                          .id
                      }
                    >
                      PR-
                      {String(
                        allocation.purchaseRequisitionLine.purchaseRequisition
                          .requisitionNumber,
                      ).padStart(4, "0")}{" "}
                      · {allocation.quantity}
                      {allocation.overOrderOverride ? (
                        <small>Override: {allocation.overrideReason}</small>
                      ) : null}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <details>
          <summary>Internal commercial fields</summary>
          <p>
            <strong>Terms:</strong> {revision.internalCommercialTerms || "None"}
          </p>
          <p>
            <strong>Notes:</strong> {revision.internalNotes || "None"}
          </p>
        </details>
      </section>

      <section className="panel">
        <h2>Retained PO revisions</h2>
        <div className="timeline">
          {order.revisions.map((item) => (
            <article key={item.id}>
              <strong>
                R{item.revisionNumber} · {item.title}
                {item.current ? " · Current" : ""}
              </strong>
              <span>
                {item.sentAt
                  ? `Sent ${new Date(item.sentAt).toLocaleString()}`
                  : "Not sent"}
              </span>
              <p>{item.revisionReason}</p>
              <small>
                {item.commitments.length} supplier commitment revision
                {item.commitments.length === 1 ? "" : "s"}
              </small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function CommandForm({
  action,
  button,
  orderId,
  projectId,
  version,
}: {
  action: (formData: FormData) => Promise<void>;
  button: string;
  orderId: string;
  projectId: string;
  version: number;
}) {
  return (
    <form action={action} className="inline-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="purchaseOrderId" value={orderId} />
      <input type="hidden" name="expectedVersion" value={version} />
      <label>
        Reason
        <input name="reason" minLength={5} maxLength={500} required />
      </label>
      <button type="submit">{button}</button>
    </form>
  );
}
