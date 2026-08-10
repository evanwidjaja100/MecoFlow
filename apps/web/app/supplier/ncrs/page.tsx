import Link from "next/link";
import { supplierNcrs } from "./data";

export default async function SupplierNcrListPage() {
  const ncrs = await supplierNcrs();
  return (
    <main className="workspace workspace--tablet">
      <div className="heading-row">
        <div>
          <p className="eyebrow">Supplier quality collaboration</p>
          <h1>Nonconformance reports</h1>
          <p className="lede">
            Review issued quality concerns and provide retained corrective
            responses.
          </p>
        </div>
        <span className="badge badge--supplier">
          {ncrs.filter(({ status }) => status !== "CLOSED").length} open
        </span>
      </div>
      <section className="panel">
        {ncrs.length === 0 ? (
          <p>No NCR is currently issued to your organization.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>NCR</th>
                <th>Project</th>
                <th>Status</th>
                <th>Responses</th>
              </tr>
            </thead>
            <tbody>
              {ncrs.map((ncr) => (
                <tr key={ncr.id}>
                  <td>
                    <Link href={`/supplier/ncrs/${ncr.id}`}>
                      {ncr.number} — {ncr.title}
                    </Link>
                  </td>
                  <td>
                    {ncr.project.code} — {ncr.project.name}
                  </td>
                  <td>
                    <span className="status">
                      {ncr.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>{ncr.supplierResponses.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
