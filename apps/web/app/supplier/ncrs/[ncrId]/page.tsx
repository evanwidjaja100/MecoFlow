import Link from "next/link";
import { notFound } from "next/navigation";
import { submitNcrResponse } from "../actions";
import { supplierNcr } from "../data";

export default async function SupplierNcrDetailPage({
  params,
}: {
  params: Promise<{ ncrId: string }>;
}) {
  const { ncrId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(ncrId)) notFound();
  const ncr = await supplierNcr(ncrId);
  return (
    <main className="workspace workspace--tablet">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/supplier/ncrs">Nonconformance reports</Link>
        <span>/</span>
        <span>{ncr.number}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">
            {ncr.project.code} — {ncr.project.name}
          </p>
          <h1>
            {ncr.number} — {ncr.title}
          </h1>
          <p className="lede">{ncr.description}</p>
        </div>
        <span className="status">{ncr.status.replaceAll("_", " ")}</span>
      </div>
      {ncr.inventoryLot ? (
        <section className="summary-grid">
          <div>
            <span>Inventory lot</span>
            <strong>
              LOT-{String(ncr.inventoryLot.lotNumber).padStart(6, "0")}
            </strong>
          </div>
          <div>
            <span>Material</span>
            <strong>{ncr.inventoryLot.item.code}</strong>
          </div>
          <div>
            <span>Disposition</span>
            <strong>{ncr.inventoryLot.status.replaceAll("_", " ")}</strong>
          </div>
        </section>
      ) : null}
      {ncr.sharedDispositionNotes ? (
        <section className="panel">
          <h2>Shared disposition</h2>
          <p>{ncr.sharedDispositionNotes}</p>
        </section>
      ) : null}
      {ncr.status !== "CLOSED" ? (
        <section className="panel">
          <h2>Submit corrective response</h2>
          <form
            action={submitNcrResponse}
            className="form-grid form-grid--wide"
          >
            <input type="hidden" name="ncrId" value={ncr.id} />
            <input type="hidden" name="expectedVersion" value={ncr.version} />
            <label>
              Response message
              <textarea
                name="message"
                minLength={5}
                maxLength={4000}
                required
              />
            </label>
            <label>
              Root cause
              <textarea name="rootCause" maxLength={4000} />
            </label>
            <label>
              Corrective action
              <textarea name="correctiveAction" maxLength={4000} />
            </label>
            <button type="submit">Submit retained response</button>
          </form>
        </section>
      ) : null}
      <section className="panel">
        <h2>Response history</h2>
        {ncr.supplierResponses.length === 0 ? (
          <p>No response submitted yet.</p>
        ) : (
          ncr.supplierResponses.map((response) => (
            <article className="panel" key={response.id}>
              <strong>
                Revision {response.revisionNumber} ·{" "}
                {response.submittedBy.displayName}
              </strong>
              <p>{response.message}</p>
              {response.rootCause ? (
                <p>
                  <b>Root cause:</b> {response.rootCause}
                </p>
              ) : null}
              {response.correctiveAction ? (
                <p>
                  <b>Corrective action:</b> {response.correctiveAction}
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
