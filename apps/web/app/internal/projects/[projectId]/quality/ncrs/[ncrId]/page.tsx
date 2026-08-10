import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../../../lib/api";
import { cancelNcr, closeNcr, issueNcr } from "../../actions";
import { ncrDetail } from "../../data";

function can(me: Awaited<ReturnType<typeof requireMe>>, permission: string) {
  return me.memberships.some((membership) =>
    membership.permissions.includes(permission),
  );
}

export default async function NcrDetailPage({
  params,
}: {
  params: Promise<{ ncrId: string; projectId: string }>;
}) {
  const { ncrId, projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(ncrId) || !/^[0-9a-f-]{36}$/i.test(projectId))
    notFound();
  const [me, ncr] = await Promise.all([
    requireMe("INTERNAL"),
    ncrDetail(ncrId),
  ]);
  return (
    <main className="workspace workspace--tablet">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/quality`}>
          Quality and allocation
        </Link>
        <span>/</span>
        <span>{ncr.number}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">{ncr.supplierOrganization.name}</p>
          <h1>
            {ncr.number} — {ncr.title}
          </h1>
          <p className="lede">{ncr.description}</p>
        </div>
        <span className="status">{ncr.status.replaceAll("_", " ")}</span>
      </div>
      <section className="panel">
        <h2>Internal disposition</h2>
        <p>
          {ncr.internalDispositionNotes || "No internal disposition notes."}
        </p>
        <small>
          {ncr.shareInternalNotes
            ? "Explicitly shared with supplier"
            : "Internal only — omitted from supplier responses"}
        </small>
      </section>
      {ncr.status === "DRAFT" && can(me, "ncr.issue") ? (
        <section className="panel">
          <h2>Issue NCR</h2>
          <form action={issueNcr} className="form-grid">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="ncrId" value={ncr.id} />
            <input type="hidden" name="expectedVersion" value={ncr.version} />
            <label>
              Reason
              <input
                name="reason"
                defaultValue="Issue NCR to responsible supplier for corrective response"
                minLength={5}
                maxLength={500}
                required
              />
            </label>
            <button type="submit">Issue to supplier</button>
          </form>
        </section>
      ) : null}
      {["ISSUED", "SUPPLIER_RESPONDED"].includes(ncr.status) &&
      can(me, "ncr.close") ? (
        <section className="panel">
          <h2>Close NCR</h2>
          <form action={closeNcr} className="form-grid">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="ncrId" value={ncr.id} />
            <input type="hidden" name="expectedVersion" value={ncr.version} />
            <label>
              Internal disposition notes
              <textarea
                name="internalDispositionNotes"
                defaultValue={ncr.internalDispositionNotes}
                minLength={5}
                maxLength={4000}
                required
              />
            </label>
            <label className="checkbox">
              <input
                name="shareInternalNotes"
                type="checkbox"
                defaultChecked={ncr.shareInternalNotes}
              />
              Explicitly share these disposition notes with supplier
            </label>
            <label>
              Reason
              <input
                name="reason"
                defaultValue="Corrective response reviewed and final disposition recorded"
                minLength={5}
                maxLength={500}
                required
              />
            </label>
            <button type="submit">Close NCR</button>
          </form>
        </section>
      ) : null}
      {["DRAFT", "ISSUED"].includes(ncr.status) && can(me, "ncr.close") ? (
        <form action={cancelNcr} className="inline-form">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="ncrId" value={ncr.id} />
          <input type="hidden" name="expectedVersion" value={ncr.version} />
          <input
            name="reason"
            defaultValue="Cancel NCR with retained history"
            minLength={5}
            maxLength={500}
            required
          />
          <button type="submit">Cancel NCR</button>
        </form>
      ) : null}
      <section className="panel">
        <h2>Supplier responses</h2>
        {ncr.supplierResponses.length === 0 ? (
          <p>Awaiting supplier response.</p>
        ) : (
          ncr.supplierResponses.map((response) => (
            <article key={response.id} className="panel">
              <strong>
                Response {response.revisionNumber} ·{" "}
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
      <section className="panel">
        <h2>Lifecycle history</h2>
        <ul>
          {ncr.transitions.map((transition) => (
            <li key={transition.id}>
              {transition.sourceStatus} → {transition.targetStatus} ·{" "}
              {transition.actor.displayName} · {transition.reason}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
