import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../../lib/api";
import {
  finalizeInspection,
  saveInspectionResults,
  uploadInspectionEvidence,
} from "../actions";
import { inspectionDetail } from "../data";
import { createNcrFromInspection } from "../../quality/actions";

function can(me: Awaited<ReturnType<typeof requireMe>>, permission: string) {
  return me.memberships.some((membership) =>
    membership.permissions.includes(permission),
  );
}

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ inspectionId: string; projectId: string }>;
}) {
  const { inspectionId, projectId } = await params;
  if (
    !/^[0-9a-f-]{36}$/i.test(projectId) ||
    !/^[0-9a-f-]{36}$/i.test(inspectionId)
  )
    notFound();
  const [me, inspection] = await Promise.all([
    requireMe("INTERNAL"),
    inspectionDetail(inspectionId),
  ]);
  if (inspection.project.id !== projectId) notFound();
  const mayWrite = inspection.status === "OPEN" && can(me, "inspection.write");
  const mayFinalize =
    inspection.status === "OPEN" && can(me, "inspection.finalize");
  const mayConditionallyAccept = can(me, "inspection.conditional-accept");
  const mayUpload = inspection.status === "OPEN" && can(me, "document.upload");
  const approvedDocuments = inspection.evidenceDocuments.filter((document) => {
    const current = document.versions.find(
      (version) => version.versionNumber === document.currentVersionNumber,
    );
    return current?.status === "APPROVED" && current.scanStatus === "CLEAN";
  });
  return (
    <main className="workspace workspace--tablet">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/inspections`}>
          Inspection work queue
        </Link>
        <span>/</span>
        <span>
          LOT-{String(inspection.inventoryLot.lotNumber).padStart(6, "0")}
        </span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Receiving inspection</p>
          <h1>
            {inspection.inventoryLot.item.code} —{" "}
            {inspection.inventoryLot.item.name}
          </h1>
          <p className="lede">
            LOT-{String(inspection.inventoryLot.lotNumber).padStart(6, "0")} ·
            GR-
            {String(
              inspection.inventoryLot.sourceGoodsReceipt.receiptNumber,
            ).padStart(4, "0")}
          </p>
        </div>
        <span className={`status status--${inspection.status.toLowerCase()}`}>
          {inspection.status}
        </span>
      </div>
      <section className="summary-grid">
        <div>
          <span>Received</span>
          <strong>
            {inspection.inventoryLot.effectiveQuantity}{" "}
            {inspection.inventoryLot.unitOfMeasure.symbol}
          </strong>
        </div>
        <div>
          <span>Heat</span>
          <strong>{inspection.inventoryLot.heatNumber || "—"}</strong>
        </div>
        <div>
          <span>Batch</span>
          <strong>{inspection.inventoryLot.batchNumber || "—"}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{inspection.version}</strong>
        </div>
      </section>

      {mayWrite ? (
        <section className="panel receiving-panel">
          <h2>Inspection results</h2>
          <form action={saveInspectionResults} className="stack">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="inspectionId" value={inspection.id} />
            <input
              type="hidden"
              name="expectedVersion"
              value={inspection.version}
            />
            <div className="receiving-lines">
              {inspection.checks.map((check) => (
                <fieldset className="receiving-line" key={check.id}>
                  <legend>
                    {check.code} — {check.name}
                    {check.required ? " (required)" : ""}
                  </legend>
                  <input type="hidden" name="checkId" value={check.id} />
                  <input
                    type="hidden"
                    name={`type-${check.id}`}
                    value={check.checkType}
                  />
                  {check.description ? <p>{check.description}</p> : null}
                  {check.checkType === "CHECKLIST" ? (
                    <label>
                      Result
                      <select
                        name={`value-${check.id}`}
                        defaultValue={
                          check.checklistPassed === false ? "FAIL" : "PASS"
                        }
                      >
                        <option value="PASS">Pass</option>
                        <option value="FAIL">Fail</option>
                      </select>
                    </label>
                  ) : check.checkType === "MEASUREMENT" ? (
                    <label>
                      Measured value{" "}
                      {check.unitOfMeasure
                        ? `(${check.unitOfMeasure.symbol})`
                        : ""}
                      <input
                        name={`value-${check.id}`}
                        inputMode="decimal"
                        defaultValue={check.measuredValue ?? ""}
                        required
                      />
                      <small>
                        Allowed {check.minimumValue ?? "unbounded"} to{" "}
                        {check.maximumValue ?? "unbounded"}; precision{" "}
                        {check.decimalPrecision}
                      </small>
                    </label>
                  ) : (
                    <>
                      <label>
                        Certificate decision
                        <select
                          name={`value-${check.id}`}
                          defaultValue={check.certificateDecision ?? "ACCEPTED"}
                        >
                          <option value="ACCEPTED">Accepted</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </label>
                      <label>
                        Approved linked certificate
                        <select
                          name={`document-${check.id}`}
                          defaultValue={check.evidenceDocumentId ?? ""}
                          required
                        >
                          <option value="">Select approved evidence</option>
                          {approvedDocuments.map((document) => (
                            <option key={document.id} value={document.id}>
                              {document.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  <label>
                    Inspector notes
                    <input
                      name={`notes-${check.id}`}
                      maxLength={1000}
                      defaultValue={check.notes}
                    />
                  </label>
                  {check.completedAt ? (
                    <small>
                      Recorded ·{" "}
                      {check.conforming ? "conforming" : "nonconforming"}
                    </small>
                  ) : null}
                </fieldset>
              ))}
            </div>
            <button type="submit">Save inspection results</button>
          </form>
        </section>
      ) : (
        <section className="panel">
          <h2>Inspection results</h2>
          <ul>
            {inspection.checks.map((check) => (
              <li key={check.id}>
                {check.code} — {check.name}:{" "}
                {check.conforming === null
                  ? "not recorded"
                  : check.conforming
                    ? "conforming"
                    : "nonconforming"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {mayUpload ? (
        <section className="panel">
          <h2>Evidence documents</h2>
          <p>
            Evidence remains private and cannot satisfy certificate review until
            its clean current version is approved through the document workflow.
          </p>
          <form
            action={uploadInspectionEvidence}
            className="form-grid"
            aria-label="Upload inspection evidence"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="inspectionId" value={inspection.id} />
            <label>
              Title
              <input name="title" minLength={2} maxLength={200} required />
            </label>
            <label>
              Evidence file
              <input
                name="file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                required
              />
            </label>
            <button type="submit">Upload evidence securely</button>
          </form>
          {inspection.evidenceDocuments.length > 0 ? (
            <ul>
              {inspection.evidenceDocuments.map((document) => (
                <li key={document.id}>
                  {document.title} · current version{" "}
                  {document.currentVersionNumber}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {mayFinalize ? (
        <section className="panel">
          <h2>Finalize disposition</h2>
          <p>
            Accepted plus rejected may not exceed the exact received quantity.
            Any remainder is quarantined.
          </p>
          <form action={finalizeInspection} className="form-grid">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="inspectionId" value={inspection.id} />
            <input
              type="hidden"
              name="expectedVersion"
              value={inspection.version}
            />
            <label>
              Disposition
              <select name="disposition" defaultValue="ACCEPTED">
                <option value="ACCEPTED">Accepted</option>
                {mayConditionallyAccept ? (
                  <option value="CONDITIONALLY_ACCEPTED">
                    Conditionally accepted
                  </option>
                ) : null}
                <option value="QUARANTINED">Quarantined</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>
            <label>
              Accepted quantity
              <input
                name="acceptedQuantity"
                inputMode="decimal"
                defaultValue={inspection.inventoryLot.effectiveQuantity}
                required
              />
            </label>
            <label>
              Rejected quantity
              <input
                name="rejectedQuantity"
                inputMode="decimal"
                defaultValue="0"
                required
              />
            </label>
            <label>
              Disposition reason
              <input
                name="reason"
                minLength={5}
                maxLength={500}
                defaultValue="Inspection checks completed and disposition recorded"
                required
              />
            </label>
            <button className="tablet-primary" type="submit">
              Finalize inspection
            </button>
          </form>
        </section>
      ) : null}

      {inspection.status === "FINALIZED" ? (
        <section className="panel">
          <h2>Final disposition</h2>
          <p>
            <strong>{inspection.disposition?.replaceAll("_", " ")}</strong> ·{" "}
            {inspection.reason}
          </p>
          <dl className="definition-list">
            <div>
              <dt>Accepted</dt>
              <dd>{inspection.acceptedQuantity}</dd>
            </div>
            <div>
              <dt>Rejected</dt>
              <dd>{inspection.rejectedQuantity}</dd>
            </div>
            <div>
              <dt>Quarantined</dt>
              <dd>{inspection.quarantinedQuantity}</dd>
            </div>
            <div>
              <dt>Finalized by</dt>
              <dd>{inspection.finalizedBy?.displayName ?? "—"}</dd>
            </div>
            <div>
              <dt>Conditional authority</dt>
              <dd>
                {inspection.conditionalAcceptanceAuthorizedBy?.displayName ??
                  "Not applicable"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {inspection.status === "FINALIZED" &&
      inspection.disposition !== "ACCEPTED" &&
      can(me, "ncr.create") ? (
        <section className="panel">
          <h2>Raise nonconformance report</h2>
          <p>
            Create a supplier-addressed NCR directly from this retained
            inspection disposition. Internal notes remain hidden unless the
            sharing control is explicitly selected.
          </p>
          <form action={createNcrFromInspection} className="form-grid">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="inspectionId" value={inspection.id} />
            <label>
              NCR title
              <input
                name="title"
                defaultValue={`Inspection nonconformance — LOT-${String(inspection.inventoryLot.lotNumber).padStart(6, "0")}`}
                minLength={3}
                maxLength={200}
                required
              />
            </label>
            <label>
              Supplier-visible description
              <textarea
                name="description"
                defaultValue="Incoming material failed the recorded inspection disposition and requires supplier corrective response."
                minLength={5}
                maxLength={4000}
                required
              />
            </label>
            <label>
              Internal disposition notes
              <textarea
                name="internalDispositionNotes"
                defaultValue="Material remains controlled under the recorded lot disposition."
                maxLength={4000}
              />
            </label>
            <label className="checkbox">
              <input name="shareInternalNotes" type="checkbox" />
              Explicitly share internal disposition notes with supplier
            </label>
            <button type="submit">Create NCR draft</button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
