import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../lib/api";
import { projectOverview } from "../../data";
import { createPurchaseOrder } from "./actions";
import { purchaseOrderWorkspace } from "./data";

export default async function PurchaseOrdersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const me = await requireMe("INTERNAL");
  const permissions = new Set(
    me.memberships.flatMap((membership) => membership.permissions),
  );
  const [project, workspace] = await Promise.all([
    projectOverview(projectId),
    purchaseOrderWorkspace(
      projectId,
      permissions.has("purchase-order.exception.read"),
    ),
  ]);
  const suppliers = project.members
    .filter(
      (member) =>
        member.status === "ACTIVE" &&
        member.membership.organization.type === "SUPPLIER",
    )
    .map((member) => member.membership.organization)
    .filter(
      (supplier, index, values) =>
        values.findIndex(({ id }) => id === supplier.id) === index,
    );
  const canWrite = permissions.has("purchase-order.write");
  const canOverride = permissions.has("purchase-order.override");

  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/internal/projects/${project.id}`}>{project.code}</Link>
        <span aria-hidden="true">/</span>
        <span>Purchase orders</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Phase 4B</p>
          <h1>Purchase orders</h1>
          <p className="lede">
            Convert approved requisition quantities into supplier-addressed,
            revision-controlled orders.
          </p>
        </div>
        <span className="badge">{workspace.purchaseOrders.length} orders</span>
      </div>

      {canWrite ? (
        <section className="panel">
          <h2>Create from approved requisitions</h2>
          {suppliers.length === 0 ? (
            <p>
              Assign an active supplier project member before creating a PO.
            </p>
          ) : workspace.requirements.length === 0 ? (
            <p>No approved requisition quantity is available to order.</p>
          ) : (
            <form
              action={createPurchaseOrder}
              className="stack"
              aria-label="Create purchase order"
            >
              <input type="hidden" name="projectId" value={projectId} />
              <div className="form-grid form-grid--wide">
                <label>
                  Title
                  <input name="title" minLength={2} maxLength={200} required />
                </label>
                <label>
                  Supplier
                  <select name="supplierOrganizationId" required>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.code} — {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Revision reason
                  <input
                    name="revisionReason"
                    minLength={5}
                    maxLength={500}
                    required
                  />
                </label>
                <label>
                  Supplier message
                  <input name="supplierMessage" maxLength={2000} />
                </label>
                <label>
                  Internal commercial terms
                  <input name="internalCommercialTerms" maxLength={4000} />
                </label>
                <label>
                  Internal notes
                  <input name="internalNotes" maxLength={2000} />
                </label>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Approved source</th>
                    <th>Approved</th>
                    <th>Already ordered</th>
                    <th>Available</th>
                    <th>Required date</th>
                    <th>Order quantity</th>
                    <th>Internal unit price</th>
                    {canOverride ? <th>Override reason</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {workspace.requirements.map((requirement) => (
                    <tr key={requirement.purchaseRequisitionLineId}>
                      <td>
                        <input
                          aria-label={`Select approved ${requirement.item.code}`}
                          name="purchaseRequisitionLineId"
                          type="checkbox"
                          value={requirement.purchaseRequisitionLineId}
                        />
                      </td>
                      <td>
                        {requirement.item.code} — {requirement.item.name}
                        <small>
                          PR-
                          {String(
                            requirement.purchaseRequisition.requisitionNumber,
                          ).padStart(4, "0")}{" "}
                          · {requirement.purchaseRequisition.title}
                        </small>
                      </td>
                      <td>{requirement.approvedQuantity}</td>
                      <td>{requirement.orderedQuantity}</td>
                      <td>{requirement.availableQuantity}</td>
                      <td>{requirement.requiredDate}</td>
                      <td>
                        <input
                          aria-label={`Order quantity for ${requirement.item.code}`}
                          defaultValue={requirement.availableQuantity}
                          name={`quantity-${requirement.purchaseRequisitionLineId}`}
                          required
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Internal unit price for ${requirement.item.code}`}
                          name={`unitPrice-${requirement.purchaseRequisitionLineId}`}
                          inputMode="decimal"
                        />
                      </td>
                      {canOverride ? (
                        <td>
                          <input
                            aria-label={`Over-order reason for ${requirement.item.code}`}
                            name={`override-${requirement.purchaseRequisitionLineId}`}
                            minLength={5}
                            maxLength={500}
                            placeholder="Required only above available"
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="submit">Create draft purchase order</button>
            </form>
          )}
        </section>
      ) : null}

      <section className="panel">
        <h2>Purchase order register</h2>
        {workspace.purchaseOrders.length === 0 ? (
          <p>No purchase order has been created for this project.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Title</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Current revision</th>
                <th>Retained revisions</th>
              </tr>
            </thead>
            <tbody>
              {workspace.purchaseOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/internal/projects/${projectId}/purchase-orders/${order.id}`}
                    >
                      PO-{String(order.purchaseOrderNumber).padStart(4, "0")}
                    </Link>
                  </td>
                  <td>{order.revisions[0]?.title}</td>
                  <td>{order.supplierOrganization.name}</td>
                  <td>
                    <span
                      className={`status status--${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>R{order.currentRevisionNumber}</td>
                  <td>{order._count.revisions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {permissions.has("purchase-order.exception.read") ? (
        <section className="panel">
          <h2>Late commitment exceptions</h2>
          {workspace.exceptions.length === 0 ? (
            <p>No latest commitment is after its BOM-required date.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Item</th>
                  <th>Supplier</th>
                  <th>Required</th>
                  <th>Original</th>
                  <th>Latest</th>
                </tr>
              </thead>
              <tbody>
                {workspace.exceptions.map((exception) => (
                  <tr key={exception.purchaseOrderLineId}>
                    <td>
                      PO-
                      {String(exception.purchaseOrderNumber).padStart(4, "0")} R
                      {exception.revisionNumber}
                    </td>
                    <td>
                      {exception.item.code} — {exception.item.name}
                    </td>
                    <td>{exception.supplierOrganization.name}</td>
                    <td>{exception.requiredDate}</td>
                    <td>{exception.originalCommitmentDate}</td>
                    <td>
                      <span className="status status--cancelled">
                        {exception.latestCommitmentDate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}
    </main>
  );
}
