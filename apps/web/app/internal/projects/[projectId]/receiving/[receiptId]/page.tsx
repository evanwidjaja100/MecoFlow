import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../../lib/api";
import {
  createCorrection,
  postGoodsReceipt,
  uploadReceiptPhoto,
} from "../actions";
import { createExplicitInspection } from "../../inspections/actions";
import { goodsReceipt } from "../data";

function can(me: Awaited<ReturnType<typeof requireMe>>, permission: string) {
  return me.memberships.some((membership) =>
    membership.permissions.includes(permission),
  );
}

export default async function GoodsReceiptPage({
  params,
}: {
  params: Promise<{ projectId: string; receiptId: string }>;
}) {
  const { projectId, receiptId } = await params;
  if (
    !/^[0-9a-f-]{36}$/i.test(projectId) ||
    !/^[0-9a-f-]{36}$/i.test(receiptId)
  )
    notFound();
  const [me, receipt] = await Promise.all([
    requireMe("INTERNAL"),
    goodsReceipt(receiptId),
  ]);
  if (receipt.project.id !== projectId) notFound();
  const mayPost = receipt.status === "DRAFT" && can(me, "receiving.post");
  const mayCorrect =
    receipt.status === "POSTED" &&
    receipt.kind === "RECEIPT" &&
    can(me, "receiving.correct");
  const mayUpload = can(me, "document.upload");
  const mayCreateInspection = can(me, "inspection.create");
  const now = new Date().toISOString().slice(0, 16);
  return (
    <main className="workspace workspace--tablet">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/internal/projects/${projectId}/receiving`}>
          Receiving
        </Link>
        <span>/</span>
        <span>GR-{String(receipt.receiptNumber).padStart(4, "0")}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">
            {receipt.kind === "CORRECTION"
              ? "Correcting entry"
              : "Goods receipt"}
          </p>
          <h1>GR-{String(receipt.receiptNumber).padStart(4, "0")}</h1>
          <p className="lede">
            ASN {receipt.advanceShipmentNotice.supplierReference} ·{" "}
            {receipt.advanceShipmentNotice.supplierOrganization.name}
          </p>
        </div>
        <span className={`status status--${receipt.status.toLowerCase()}`}>
          {receipt.status}
        </span>
      </div>
      <section className="summary-grid">
        <div>
          <span>Received at</span>
          <strong>{new Date(receipt.receivedAt).toLocaleString()}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>{receipt.warehouseLocation}</strong>
        </div>
        <div>
          <span>Created by</span>
          <strong>{receipt.createdBy.displayName}</strong>
        </div>
        <div>
          <span>Posted by</span>
          <strong>{receipt.postedBy?.displayName ?? "Draft"}</strong>
        </div>
      </section>
      {mayPost ? (
        <section className="panel">
          <h2>Post receipt</h2>
          <p>
            Posting is immutable and atomically creates awaiting-inspection
            inventory effects. Corrections are separate entries.
          </p>
          <form action={postGoodsReceipt}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="receiptId" value={receipt.id} />
            <input
              type="hidden"
              name="expectedVersion"
              value={receipt.version}
            />
            <button className="tablet-primary" type="submit">
              Post receipt
            </button>
          </form>
        </section>
      ) : null}
      <section className="panel receiving-panel">
        <h2>Traceable lines</h2>
        <div className="receiving-lines">
          {receipt.lines.map((line) => (
            <article className="receiving-line" key={line.id}>
              <strong>
                {line.advanceShipmentNoticeLine.purchaseOrderLine.item.code} —{" "}
                {line.advanceShipmentNoticeLine.purchaseOrderLine.item.name}
              </strong>
              <dl className="definition-list">
                <div>
                  <dt>Quantity delta</dt>
                  <dd>
                    {line.quantityDelta}{" "}
                    {
                      line.advanceShipmentNoticeLine.purchaseOrderLine
                        .unitOfMeasure.symbol
                    }
                  </dd>
                </div>
                <div>
                  <dt>Heat</dt>
                  <dd>{line.heatNumber || "—"}</dd>
                </div>
                <div>
                  <dt>Batch</dt>
                  <dd>{line.batchNumber || "—"}</dd>
                </div>
                <div>
                  <dt>Manufacturer</dt>
                  <dd>{line.manufacturer || "—"}</dd>
                </div>
                <div>
                  <dt>Package</dt>
                  <dd>{line.packageReference || "—"}</dd>
                </div>
                <div>
                  <dt>Inventory</dt>
                  <dd>
                    {line.inventoryLot
                      ? `LOT-${String(line.inventoryLot.lotNumber).padStart(6, "0")} · ${line.inventoryLot.status.replace("_", " ")}`
                      : line.inventoryLotAdjustment
                        ? `Adjustment to LOT-${String(line.inventoryLotAdjustment.inventoryLot.lotNumber).padStart(6, "0")}`
                        : "Created on posting"}
                  </dd>
                </div>
              </dl>
              {line.inventoryLot?.status === "AWAITING_INSPECTION" &&
              mayCreateInspection ? (
                <form action={createExplicitInspection}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input
                    type="hidden"
                    name="inventoryLotId"
                    value={line.inventoryLot.id}
                  />
                  <button type="submit">Open receiving inspection</button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      {mayCorrect ? (
        <section className="panel">
          <h2>Create correcting entry</h2>
          <p>
            Select affected lines and enter a signed quantity delta. The
            original posted receipt and lot remain immutable.
          </p>
          <form
            action={createCorrection}
            className="stack receiving-form"
            aria-label="Create receipt correction"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="receiptId" value={receipt.id} />
            <div className="form-grid">
              <label>
                Correction reason
                <input name="reason" minLength={5} maxLength={500} required />
              </label>
              <label>
                Correction time
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
                  defaultValue={receipt.warehouseLocation}
                  maxLength={200}
                  required
                />
              </label>
            </div>
            <div className="receiving-lines">
              {receipt.lines.map((line) => (
                <fieldset className="receiving-line" key={line.id}>
                  <legend>
                    <label className="checkbox">
                      <input
                        name="goodsReceiptLineId"
                        type="checkbox"
                        value={line.id}
                      />
                      Correct{" "}
                      {
                        line.advanceShipmentNoticeLine.purchaseOrderLine.item
                          .code
                      }
                    </label>
                  </legend>
                  <label>
                    Quantity delta
                    <input
                      name={`delta-${line.id}`}
                      inputMode="decimal"
                      defaultValue="-1"
                    />
                  </label>
                  <label>
                    Heat number
                    <input
                      name={`heat-${line.id}`}
                      defaultValue={line.heatNumber}
                    />
                  </label>
                  <label>
                    Batch number
                    <input
                      name={`batch-${line.id}`}
                      defaultValue={line.batchNumber}
                    />
                  </label>
                  <label>
                    Manufacturer
                    <input
                      name={`manufacturer-${line.id}`}
                      defaultValue={line.manufacturer}
                    />
                  </label>
                  <label>
                    Package reference
                    <input
                      name={`package-${line.id}`}
                      defaultValue={line.packageReference}
                    />
                  </label>
                </fieldset>
              ))}
            </div>
            <button type="submit">Create correction draft</button>
          </form>
        </section>
      ) : null}
      {mayUpload ? (
        <section className="panel">
          <h2>Receiving photographs</h2>
          <p>
            Photographs use the secure document service and are authorized
            through this receipt association.
          </p>
          <form
            action={uploadReceiptPhoto}
            className="form-grid"
            aria-label="Upload receiving photograph"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="receiptId" value={receipt.id} />
            <label>
              Title
              <input name="title" minLength={2} maxLength={200} required />
            </label>
            <label>
              Photograph
              <input
                name="file"
                type="file"
                accept=".png,.jpg,.jpeg"
                capture="environment"
                required
              />
            </label>
            <button type="submit">Upload photograph securely</button>
          </form>
        </section>
      ) : null}
      {receipt.corrections.length > 0 ? (
        <section className="panel">
          <h2>Corrections</h2>
          <ul>
            {receipt.corrections.map((correction) => (
              <li key={correction.id}>
                <Link
                  href={`/internal/projects/${projectId}/receiving/${correction.id}`}
                >
                  GR-{String(correction.receiptNumber).padStart(4, "0")}
                </Link>{" "}
                · {correction.status}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
