import Link from "next/link";
import { notFound } from "next/navigation";
import { acknowledgePurchaseOrder, appendCommitment } from "../actions";
import { supplierPurchaseOrder } from "../data";
import { createAsn } from "../../asns/actions";

export default async function SupplierPurchaseOrderPage({
  params,
}: {
  params: Promise<{ purchaseOrderId: string }>;
}) {
  const { purchaseOrderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(purchaseOrderId)) notFound();
  const order = await supplierPurchaseOrder(purchaseOrderId);
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/supplier/purchase-orders">Purchase orders</Link>
        <span aria-hidden="true">/</span>
        <span>PO-{String(order.purchaseOrderNumber).padStart(4, "0")}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">
            PO-{String(order.purchaseOrderNumber).padStart(4, "0")} · R
            {order.revision.revisionNumber}
          </p>
          <h1>{order.revision.title}</h1>
          <p className="lede">
            {order.project.code} — {order.project.name}
          </p>
        </div>
        <span className={`status status--${order.status.toLowerCase()}`}>
          {order.status}
        </span>
      </div>

      <section className="panel">
        <h2>Supplier response</h2>
        <p>
          {order.revision.supplierMessage ||
            "No additional supplier instruction."}
        </p>
        {order.status === "SENT" ? (
          <form
            action={acknowledgePurchaseOrder}
            className="inline-form"
            aria-label="Acknowledge purchase order"
          >
            <input type="hidden" name="purchaseOrderId" value={order.id} />
            <input type="hidden" name="expectedVersion" value={order.version} />
            <label>
              Reason
              <input name="reason" minLength={5} maxLength={500} required />
            </label>
            <button type="submit">Acknowledge purchase order</button>
          </form>
        ) : (
          <p>
            Acknowledged{" "}
            {order.acknowledgedAt
              ? new Date(order.acknowledgedAt).toLocaleString()
              : ""}
          </p>
        )}
      </section>

      {order.status === "ACKNOWLEDGED" ? (
        <section className="panel">
          <h2>Create advance shipment notice</h2>
          <p>
            Create a draft only from lines in this acknowledged PO revision.
          </p>
          <form
            action={createAsn}
            className="stack"
            aria-label="Create advance shipment notice"
          >
            <input type="hidden" name="purchaseOrderId" value={order.id} />
            <div className="form-grid form-grid--wide">
              <label>
                Supplier reference
                <input
                  name="supplierReference"
                  minLength={1}
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Carrier
                <input name="carrier" maxLength={200} />
              </label>
              <label>
                Tracking number
                <input name="trackingNumber" maxLength={200} />
              </label>
              <label>
                Estimated arrival
                <input name="estimatedArrivalDate" type="date" />
              </label>
              <label>
                Notes
                <input name="notes" maxLength={2000} />
              </label>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Ship quantity</th>
                  <th>Package reference</th>
                </tr>
              </thead>
              <tbody>
                {order.revision.lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      {line.item.code} — {line.item.name}
                      <input
                        type="hidden"
                        name="purchaseOrderLineId"
                        value={line.id}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Ship quantity for ${line.item.code}`}
                        name={`quantity-${line.id}`}
                        defaultValue={line.orderedQuantity}
                        inputMode="decimal"
                        required
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Package reference for ${line.item.code}`}
                        name={`package-${line.id}`}
                        maxLength={200}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="submit">Create draft ASN</button>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <h2>Ordered lines and commitment dates</h2>
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Item</th>
              <th>Ordered</th>
              <th>Required date</th>
              <th>Original commitment</th>
              <th>Latest commitment</th>
            </tr>
          </thead>
          <tbody>
            {order.revision.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.lineNumber}</td>
                <td>
                  {line.item.code} — {line.item.name}
                </td>
                <td>
                  {line.orderedQuantity} {line.unitOfMeasure.symbol}
                </td>
                <td>{line.requiredDate}</td>
                <td>{line.originalCommitmentDate ?? "Pending"}</td>
                <td>{line.latestCommitmentDate ?? "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {order.status === "ACKNOWLEDGED" ? (
          <form
            action={appendCommitment}
            className="stack"
            aria-label="Append commitment revision"
          >
            <input type="hidden" name="purchaseOrderId" value={order.id} />
            <input type="hidden" name="expectedVersion" value={order.version} />
            {order.revision.lines.map((line) => (
              <label key={line.id}>
                {line.item.code} committed date
                <input
                  type="hidden"
                  name="purchaseOrderLineId"
                  value={line.id}
                />
                <input
                  aria-label={`Committed date for ${line.item.code}`}
                  defaultValue={line.latestCommitmentDate ?? line.requiredDate}
                  name={`committedDate-${line.id}`}
                  type="date"
                  required
                />
              </label>
            ))}
            <label>
              Supplier note
              <input name="note" maxLength={1000} />
            </label>
            <button type="submit">Append commitment revision</button>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <h2>Commitment history</h2>
        <div className="timeline">
          {order.revision.commitments.map((commitment) => (
            <article key={commitment.id}>
              <strong>Commitment revision {commitment.revisionNumber}</strong>
              <span>{new Date(commitment.createdAt).toLocaleString()}</span>
              <p>{commitment.note || "No note."}</p>
            </article>
          ))}
          {order.revision.commitments.length === 0 ? (
            <p>No commitment has been recorded.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
