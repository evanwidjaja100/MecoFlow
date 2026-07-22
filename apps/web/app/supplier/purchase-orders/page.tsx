import Link from "next/link";
import { supplierPurchaseOrders } from "./data";

export default async function SupplierPurchaseOrdersPage() {
  const orders = await supplierPurchaseOrders();
  return (
    <main className="workspace">
      <p className="eyebrow">Supplier portal</p>
      <div className="heading-row">
        <div>
          <h1>Purchase orders</h1>
          <p className="lede">
            Orders addressed to your supplier organization only.
          </p>
        </div>
        <span className="badge badge--supplier">{orders.length} visible</span>
      </div>
      <section className="panel">
        {orders.length === 0 ? (
          <p>
            No sent purchase order is currently addressed to your organization.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>PO</th>
                <th>Project</th>
                <th>Title</th>
                <th>Revision</th>
                <th>Status</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/supplier/purchase-orders/${order.id}`}>
                      PO-{String(order.purchaseOrderNumber).padStart(4, "0")}
                    </Link>
                  </td>
                  <td>
                    {order.project.code} — {order.project.name}
                  </td>
                  <td>{order.revision.title}</td>
                  <td>R{order.revision.revisionNumber}</td>
                  <td>
                    <span
                      className={`status status--${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.sentAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
