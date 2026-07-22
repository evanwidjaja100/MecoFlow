import Link from "next/link";
import { supplierAsns } from "./data";

export default async function SupplierAsnsPage() {
  const asns = await supplierAsns();
  return (
    <main className="workspace">
      <p className="eyebrow">Supplier portal</p>
      <div className="heading-row">
        <div>
          <h1>Advance shipment notices</h1>
          <p className="lede">
            Shipments created from your organization&apos;s acknowledged
            purchase orders.
          </p>
        </div>
        <span className="badge badge--supplier">{asns.length} notices</span>
      </div>
      <section className="panel">
        {asns.length === 0 ? (
          <p>No advance shipment notice has been created.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ASN</th>
                <th>Project</th>
                <th>PO</th>
                <th>Status</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {asns.map((asn) => (
                <tr key={asn.id}>
                  <td>
                    <Link href={`/supplier/asns/${asn.id}`}>
                      {asn.supplierReference}
                    </Link>
                  </td>
                  <td>
                    {asn.project.code} — {asn.project.name}
                  </td>
                  <td>
                    PO-
                    {String(asn.purchaseOrder.purchaseOrderNumber).padStart(
                      4,
                      "0",
                    )}
                  </td>
                  <td>
                    <span
                      className={`status status--${asn.status.toLowerCase()}`}
                    >
                      {asn.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {asn.estimatedArrivalDate?.slice(0, 10) ?? "Not provided"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
