import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../lib/api";
import {
  consumeAllocation,
  createAllocation,
  releaseAllocation,
} from "./actions";
import { allocationList, allocationOptions, ncrList } from "./data";

function can(me: Awaited<ReturnType<typeof requireMe>>, permission: string) {
  return me.memberships.some((membership) =>
    membership.permissions.includes(permission),
  );
}

export default async function QualityWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const me = await requireMe("INTERNAL");
  const mayReadAllocations = can(me, "allocation.read");
  const [ncrs, allocations, options] = await Promise.all([
    ncrList(projectId),
    mayReadAllocations ? allocationList(projectId) : Promise.resolve([]),
    mayReadAllocations
      ? allocationOptions(projectId)
      : Promise.resolve({ bomLines: [], inventoryLots: [] }),
  ]);
  const mayCreate = can(me, "allocation.create");
  return (
    <main className="workspace workspace--tablet">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span>/</span>
        <Link href={`/internal/projects/${projectId}`}>Project</Link>
        <span>/</span>
        <span>Quality and allocation</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Phase 6B · controlled material</p>
          <h1>NCR and material allocation</h1>
          <p className="lede">
            Coordinate supplier corrective responses and reserve traceable
            accepted material against released BOM requirements.
          </p>
        </div>
      </div>

      <section className="panel">
        <h2>Nonconformance reports</h2>
        {ncrs.length === 0 ? (
          <p>No NCR has been raised for this project.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>NCR</th>
                <th>Supplier</th>
                <th>Source</th>
                <th>Status</th>
                <th>Responses</th>
              </tr>
            </thead>
            <tbody>
              {ncrs.map((ncr) => (
                <tr key={ncr.id}>
                  <td>
                    <Link
                      href={`/internal/projects/${projectId}/quality/ncrs/${ncr.id}`}
                    >
                      {ncr.number} — {ncr.title}
                    </Link>
                  </td>
                  <td>{ncr.supplierOrganization.name}</td>
                  <td>{ncr.sourceType.replaceAll("_", " ")}</td>
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

      {mayCreate ? (
        <section className="panel">
          <h2>Allocate accepted material</h2>
          <p>
            The server matches item and unit, verifies the current released BOM,
            and locks the lot while checking available accepted quantity.
          </p>
          <form action={createAllocation} className="form-grid form-grid--wide">
            <input type="hidden" name="projectId" value={projectId} />
            <label>
              Accepted inventory lot
              <select name="inventoryLotId" required>
                <option value="">Select lot</option>
                {options.inventoryLots
                  .filter(
                    ({ availableQuantity }) => Number(availableQuantity) > 0,
                  )
                  .map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      LOT-{String(lot.lotNumber).padStart(6, "0")} ·{" "}
                      {lot.item.code} · available {lot.availableQuantity}{" "}
                      {lot.unitOfMeasure.symbol} ·{" "}
                      {lot.status.replaceAll("_", " ")}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Released BOM line
              <select name="bomLineId" required>
                <option value="">Select requirement</option>
                {options.bomLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.bomRevision.bom.workPackage?.code ?? "PROJECT"} · line{" "}
                    {line.lineNumber} · {line.item.code} · required{" "}
                    {line.quantity} {line.unitOfMeasure.symbol}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input name="quantity" inputMode="decimal" required />
            </label>
            <label>
              Conditional-use reason
              <input
                name="conditionalUseReason"
                minLength={5}
                maxLength={500}
              />
              <small>Required only for conditionally accepted lots.</small>
            </label>
            <button type="submit">Allocate material</button>
          </form>
        </section>
      ) : null}

      {mayReadAllocations ? (
        <section className="panel">
          <h2>Allocation history</h2>
          {allocations.length === 0 ? (
            <p>No material allocations recorded.</p>
          ) : (
            <div className="stack">
              {allocations.map((allocation) => (
                <article className="panel" key={allocation.id}>
                  <div className="heading-row">
                    <div>
                      <strong>
                        LOT-
                        {String(allocation.inventoryLot.lotNumber).padStart(
                          6,
                          "0",
                        )}{" "}
                        · {allocation.inventoryLot.item.code}
                      </strong>
                      <p>
                        {allocation.quantity}{" "}
                        {allocation.inventoryLot.unitOfMeasure.symbol} → BOM
                        line {allocation.bomLine.lineNumber}
                      </p>
                    </div>
                    <span className="status">{allocation.status}</span>
                  </div>
                  {allocation.conditionalUseAuthorizedBy ? (
                    <p>
                      Conditional use authorized by{" "}
                      {allocation.conditionalUseAuthorizedBy.displayName}:{" "}
                      {allocation.conditionalUseReason}
                    </p>
                  ) : null}
                  {allocation.status === "ALLOCATED" ? (
                    <div className="button-row">
                      {can(me, "allocation.release") ? (
                        <form
                          action={releaseAllocation}
                          className="inline-form"
                        >
                          <input
                            type="hidden"
                            name="projectId"
                            value={projectId}
                          />
                          <input
                            type="hidden"
                            name="allocationId"
                            value={allocation.id}
                          />
                          <input
                            type="hidden"
                            name="expectedVersion"
                            value={allocation.version}
                          />
                          <input
                            name="reason"
                            defaultValue="Release unused material reservation"
                            minLength={5}
                            maxLength={500}
                            required
                          />
                          <button type="submit">Release</button>
                        </form>
                      ) : null}
                      {can(me, "allocation.consume") ? (
                        <form
                          action={consumeAllocation}
                          className="inline-form"
                        >
                          <input
                            type="hidden"
                            name="projectId"
                            value={projectId}
                          />
                          <input
                            type="hidden"
                            name="allocationId"
                            value={allocation.id}
                          />
                          <input
                            type="hidden"
                            name="expectedVersion"
                            value={allocation.version}
                          />
                          <input
                            name="reason"
                            defaultValue="Issue allocated material to production"
                            minLength={5}
                            maxLength={500}
                            required
                          />
                          <button type="submit">Consume</button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                  {allocation.transitions.length > 0 ? (
                    <small>
                      Trace:{" "}
                      {allocation.transitions
                        .map(
                          (transition) =>
                            `${transition.sourceStatus} → ${transition.targetStatus} (${transition.quantitySnapshot})`,
                        )
                        .join("; ")}
                    </small>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
