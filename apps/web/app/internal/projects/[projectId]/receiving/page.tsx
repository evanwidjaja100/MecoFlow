import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../lib/api";
import { arriveAsn, createGoodsReceipt } from "./actions";
import { receivingWorkspace } from "./data";

function can(me: Awaited<ReturnType<typeof requireMe>>, permission: string) {
  return me.memberships.some((membership) =>
    membership.permissions.includes(permission),
  );
}

export default async function ReceivingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const [me, workspace] = await Promise.all([
    requireMe("INTERNAL"),
    receivingWorkspace(projectId),
  ]);
  const mayArrive = can(me, "shipment.arrive");
  const mayReceive = can(me, "receiving.write");
  const now = new Date().toISOString().slice(0, 16);
  return (
    <main className="workspace workspace--tablet">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span>/</span>
        <Link href={`/internal/projects/${projectId}`}>Project</Link>
        <span>/</span>
        <span>Receiving</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Phase 5B · tablet receiving</p>
          <h1>Shipments and receiving</h1>
          <p className="lede">
            Record arrivals, traceability, draft receipts, posting, corrections,
            and awaiting-inspection inventory lots.
          </p>
        </div>
        <span className="badge">{workspace.asns.length} ASNs</span>
      </div>

      <section className="panel receiving-panel">
        <h2>Advance shipment notices</h2>
        {workspace.asns.length === 0 ? (
          <p>No supplier ASN is available.</p>
        ) : (
          <div className="stack">
            {workspace.asns.map((asn) => (
              <article className="receiving-card" key={asn.id}>
                <div className="heading-row">
                  <div>
                    <strong>{asn.supplierReference}</strong>
                    <small>
                      {asn.supplierOrganization.name} · PO-
                      {String(asn.purchaseOrder.purchaseOrderNumber).padStart(
                        4,
                        "0",
                      )}
                    </small>
                  </div>
                  <span
                    className={`status status--${asn.status.toLowerCase()}`}
                  >
                    {asn.status.replace("_", " ")}
                  </span>
                </div>
                <p>
                  {asn.carrier || "Carrier not provided"} ·{" "}
                  {asn.trackingNumber || "No tracking number"}
                </p>
                {asn.status === "IN_TRANSIT" && mayArrive ? (
                  <form
                    action={arriveAsn}
                    className="tablet-command"
                    aria-label={`Record arrival ${asn.supplierReference}`}
                  >
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="asnId" value={asn.id} />
                    <input
                      type="hidden"
                      name="expectedVersion"
                      value={asn.version}
                    />
                    <label>
                      Arrival reason
                      <input
                        name="reason"
                        defaultValue="Shipment verified at receiving dock"
                        minLength={5}
                        maxLength={500}
                        required
                      />
                    </label>
                    <button type="submit">Record arrival</button>
                  </form>
                ) : null}
                {asn.status === "ARRIVED" && mayReceive ? (
                  <details>
                    <summary>Create draft goods receipt</summary>
                    <form
                      action={createGoodsReceipt}
                      className="stack receiving-form"
                      aria-label={`Create receipt for ${asn.supplierReference}`}
                    >
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="asnId" value={asn.id} />
                      <div className="form-grid">
                        <label>
                          Received at
                          <input
                            name="receivedAt"
                            type="datetime-local"
                            defaultValue={now}
                            required
                          />
                        </label>
                        <label>
                          Warehouse location
                          <input
                            name="warehouseLocation"
                            defaultValue="Receiving dock"
                            maxLength={200}
                            required
                          />
                        </label>
                        <label>
                          Notes
                          <input name="notes" maxLength={2000} />
                        </label>
                      </div>
                      <div className="receiving-lines">
                        {asn.lines.map((line) => (
                          <fieldset key={line.id} className="receiving-line">
                            <legend>
                              {line.purchaseOrderLine.item.code} —{" "}
                              {line.purchaseOrderLine.item.name}
                            </legend>
                            <input
                              type="hidden"
                              name="advanceShipmentNoticeLineId"
                              value={line.id}
                            />
                            <label>
                              Received quantity (
                              {line.purchaseOrderLine.unitOfMeasure.symbol})
                              <input
                                name={`quantity-${line.id}`}
                                inputMode="decimal"
                                defaultValue={line.shippedQuantity}
                                required
                              />
                            </label>
                            <label>
                              Heat number
                              <input name={`heat-${line.id}`} maxLength={200} />
                            </label>
                            <label>
                              Batch number
                              <input
                                name={`batch-${line.id}`}
                                maxLength={200}
                              />
                            </label>
                            <label>
                              Manufacturer
                              <input
                                name={`manufacturer-${line.id}`}
                                maxLength={200}
                              />
                            </label>
                            <label>
                              Package reference
                              <input
                                name={`package-${line.id}`}
                                defaultValue={line.packageReference}
                                maxLength={200}
                              />
                            </label>
                          </fieldset>
                        ))}
                      </div>
                      <button className="tablet-primary" type="submit">
                        Save draft receipt
                      </button>
                    </form>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel receiving-panel">
        <h2>Goods receipt register</h2>
        {workspace.receipts.length === 0 ? (
          <p>No goods receipt has been created.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>ASN</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Received</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {workspace.receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td>
                    <Link
                      href={`/internal/projects/${projectId}/receiving/${receipt.id}`}
                    >
                      GR-{String(receipt.receiptNumber).padStart(4, "0")}
                    </Link>
                  </td>
                  <td>{receipt.advanceShipmentNotice.supplierReference}</td>
                  <td>{receipt.kind}</td>
                  <td>
                    <span
                      className={`status status--${receipt.status.toLowerCase()}`}
                    >
                      {receipt.status}
                    </span>
                  </td>
                  <td>{new Date(receipt.receivedAt).toLocaleString()}</td>
                  <td>{receipt.warehouseLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
