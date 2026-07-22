import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cancelAsn,
  dispatchAsn,
  submitAsn,
  uploadAsnDocument,
} from "../actions";
import { supplierAsn } from "../data";

export default async function SupplierAsnPage({
  params,
}: {
  params: Promise<{ asnId: string }>;
}) {
  const { asnId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(asnId)) notFound();
  const asn = await supplierAsn(asnId);
  const command =
    asn.status === "DRAFT"
      ? submitAsn
      : asn.status === "SUBMITTED"
        ? dispatchAsn
        : null;
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/supplier/asns">ASNs</Link>
        <span>/</span>
        <span>{asn.supplierReference}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Advance shipment notice</p>
          <h1>{asn.supplierReference}</h1>
          <p className="lede">
            {asn.project.code} · PO-
            {String(asn.purchaseOrder.purchaseOrderNumber).padStart(4, "0")}
          </p>
        </div>
        <span className={`status status--${asn.status.toLowerCase()}`}>
          {asn.status.replace("_", " ")}
        </span>
      </div>
      {command ? (
        <section className="panel">
          <h2>Shipment transition</h2>
          <form
            action={command}
            className="inline-lifecycle-form"
            aria-label={asn.status === "DRAFT" ? "Submit ASN" : "Dispatch ASN"}
          >
            <input type="hidden" name="asnId" value={asn.id} />
            <input type="hidden" name="expectedVersion" value={asn.version} />
            <label>
              Reason
              <input name="reason" minLength={5} maxLength={500} required />
            </label>
            <button type="submit">
              {asn.status === "DRAFT" ? "Submit ASN" : "Mark in transit"}
            </button>
          </form>
          {["DRAFT", "SUBMITTED"].includes(asn.status) ? (
            <form action={cancelAsn} className="inline-lifecycle-form">
              <input type="hidden" name="asnId" value={asn.id} />
              <input type="hidden" name="expectedVersion" value={asn.version} />
              <label>
                Cancellation reason
                <input name="reason" minLength={5} maxLength={500} required />
              </label>
              <button className="button--danger" type="submit">
                Cancel ASN
              </button>
            </form>
          ) : null}
        </section>
      ) : null}
      <section className="panel">
        <h2>Shipment lines</h2>
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Package</th>
            </tr>
          </thead>
          <tbody>
            {asn.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.lineNumber}</td>
                <td>
                  {line.purchaseOrderLine.item.code} —{" "}
                  {line.purchaseOrderLine.item.name}
                </td>
                <td>
                  {line.shippedQuantity}{" "}
                  {line.purchaseOrderLine.unitOfMeasure.symbol}
                </td>
                <td>{line.packageReference || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel">
        <h2>Packing lists and certificates</h2>
        <p>
          Files use private quarantine, checksum verification, malware scanning,
          and object-level authorization.
        </p>
        <form
          action={uploadAsnDocument}
          className="form-grid"
          aria-label="Upload ASN document"
        >
          <input type="hidden" name="asnId" value={asn.id} />
          <input type="hidden" name="projectId" value={asn.project.id} />
          <label>
            Document type
            <select name="category">
              <option value="PACKING_LIST">Packing list</option>
              <option value="CERTIFICATE">Certificate</option>
            </select>
          </label>
          <label>
            Title
            <input name="title" minLength={2} maxLength={200} required />
          </label>
          <label>
            File
            <input
              name="file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
              required
            />
          </label>
          <button type="submit">Upload securely</button>
        </form>
      </section>
      <section className="panel">
        <h2>Shipment history</h2>
        <div className="timeline">
          {asn.transitions.map((transition) => (
            <article key={transition.id}>
              <strong>
                {transition.sourceStatus.replace("_", " ")} →{" "}
                {transition.targetStatus.replace("_", " ")}
              </strong>
              <span>{new Date(transition.occurredAt).toLocaleString()}</span>
              <p>{transition.reason}</p>
            </article>
          ))}
          {asn.transitions.length === 0 ? <p>No transition recorded.</p> : null}
        </div>
      </section>
    </main>
  );
}
