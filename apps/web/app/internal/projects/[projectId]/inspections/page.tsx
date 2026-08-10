import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../lib/api";
import { createCheckDefinition } from "./actions";
import {
  inspectionDefinitions,
  inspectionItems,
  inspectionQueue,
} from "./data";

function can(me: Awaited<ReturnType<typeof requireMe>>, permission: string) {
  return me.memberships.some((membership) =>
    membership.permissions.includes(permission),
  );
}

export default async function InspectionQueuePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const me = await requireMe("INTERNAL");
  const mayConfigure = can(me, "inspection.configure");
  const [inspections, definitions, items] = await Promise.all([
    inspectionQueue(projectId),
    mayConfigure ? inspectionDefinitions() : Promise.resolve([]),
    mayConfigure ? inspectionItems() : Promise.resolve([]),
  ]);
  const open = inspections.filter((inspection) => inspection.status === "OPEN");
  const finalized = inspections.filter(
    (inspection) => inspection.status === "FINALIZED",
  );
  return (
    <main className="workspace workspace--tablet">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span>/</span>
        <Link href={`/internal/projects/${projectId}`}>Project</Link>
        <span>/</span>
        <span>Receiving inspections</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Phase 6A · quality receiving</p>
          <h1>Inspection work queue</h1>
          <p className="lede">
            Complete snapshotted checks, review approved certificate evidence,
            and finalize each lot exactly once.
          </p>
        </div>
        <span className="badge">{open.length} open</span>
      </div>

      <section className="panel receiving-panel">
        <h2>Open inspections</h2>
        {open.length === 0 ? (
          <p>No receiving inspection is waiting for QA/QC.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Lot</th>
                <th>Material</th>
                <th>Received</th>
                <th>Checks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {open.map((inspection) => (
                <tr key={inspection.id}>
                  <td>
                    <Link
                      href={`/internal/projects/${projectId}/inspections/${inspection.id}`}
                    >
                      LOT-
                      {String(inspection.inventoryLot.lotNumber).padStart(
                        6,
                        "0",
                      )}
                    </Link>
                  </td>
                  <td>
                    {inspection.inventoryLot.item.code} —{" "}
                    {inspection.inventoryLot.item.name}
                  </td>
                  <td>
                    {inspection.inventoryLot.effectiveQuantity}{" "}
                    {inspection.inventoryLot.unitOfMeasure.symbol}
                  </td>
                  <td>
                    {
                      inspection.checks.filter((check) => check.completedAt)
                        .length
                    }
                    /{inspection.checks.length}
                  </td>
                  <td>
                    <span className="status status--draft">OPEN</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {finalized.length > 0 ? (
        <section className="panel">
          <h2>Finalized inspections</h2>
          <ul className="stack">
            {finalized.map((inspection) => (
              <li key={inspection.id}>
                <Link
                  href={`/internal/projects/${projectId}/inspections/${inspection.id}`}
                >
                  LOT-
                  {String(inspection.inventoryLot.lotNumber).padStart(6, "0")}
                </Link>{" "}
                · {inspection.disposition?.replaceAll("_", " ")} · accepted{" "}
                {inspection.acceptedQuantity}, rejected{" "}
                {inspection.rejectedQuantity}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mayConfigure ? (
        <section className="panel">
          <h2>Inspection-required material configuration</h2>
          <p>
            An item with at least one active check is inspection-required.
            Active checks are snapshotted when its receipt lot is posted.
          </p>
          <form action={createCheckDefinition} className="form-grid">
            <input type="hidden" name="projectId" value={projectId} />
            <label>
              Material
              <select name="itemId" required>
                <option value="">Select material</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Check code
              <input name="code" maxLength={50} required />
            </label>
            <label>
              Check name
              <input name="name" minLength={2} maxLength={200} required />
            </label>
            <label>
              Type
              <select name="checkType" defaultValue="CHECKLIST">
                <option value="CHECKLIST">Checklist</option>
                <option value="MEASUREMENT">Measurement</option>
                <option value="CERTIFICATE">Certificate review</option>
              </select>
            </label>
            <label>
              Measurement precision
              <input name="decimalPrecision" type="number" min="0" max="6" />
            </label>
            <label>
              Minimum value
              <input name="minimumValue" inputMode="decimal" />
            </label>
            <label>
              Maximum value
              <input name="maximumValue" inputMode="decimal" />
            </label>
            <label>
              Description
              <input name="description" maxLength={1000} />
            </label>
            <label className="checkbox">
              <input name="required" type="checkbox" defaultChecked />
              Required before finalization
            </label>
            <button type="submit">Add inspection check</button>
          </form>
          {definitions.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((definition) => (
                  <tr key={definition.id}>
                    <td>{definition.item.code}</td>
                    <td>
                      {definition.code} — {definition.name}
                    </td>
                    <td>{definition.checkType}</td>
                    <td>{definition.required ? "Yes" : "No"}</td>
                    <td>{definition.active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
