import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../lib/api";
import { deactivateItem, updateItem } from "../actions";
import {
  formatDateTime,
  itemCategories,
  itemDetail,
  unitsOfMeasure,
  type SpecificationAttributeDefinition,
} from "../data";
import { SpecificationFields } from "../specification-fields";

function displaySpecificationValue(
  value: string | boolean | undefined,
): string {
  if (value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      itemId,
    )
  ) {
    notFound();
  }
  const [me, item, categories, units] = await Promise.all([
    requireMe("INTERNAL"),
    itemDetail(itemId),
    itemCategories(),
    unitsOfMeasure(),
  ]);
  const canWrite =
    item.active &&
    me.memberships.some((membership) =>
      membership.permissions.includes("item.write"),
    );
  const category = categories.find(({ id }) => id === item.itemCategory.id);
  const values = new Map(
    item.specificationValues.map(({ attributeDefinitionId, value }) => [
      attributeDefinitionId,
      value,
    ]),
  );
  const definitions = new Map<string, SpecificationAttributeDefinition>();
  for (const definition of category?.specificationAttributes ?? []) {
    definitions.set(definition.id, definition);
  }
  for (const specification of item.specificationValues) {
    if (!definitions.has(specification.attributeDefinitionId)) {
      definitions.set(
        specification.attributeDefinitionId,
        specification.attributeDefinition,
      );
    }
  }
  const specificationDefinitions = [...definitions.values()].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
  );

  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/items">Items</Link>
        <span aria-hidden="true">/</span>
        <span>{item.code}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">{item.itemCategory.name}</p>
          <h1>{item.name}</h1>
          <p className="lede">{item.code}</p>
        </div>
        <span
          className={`status status--${item.active ? "active" : "inactive"}`}
        >
          {item.active ? "Active" : "Inactive"}
        </span>
      </div>

      <section className="summary-grid" aria-label="Item summary">
        <div>
          <span>Category</span>
          <strong>{item.itemCategory.name}</strong>
        </div>
        <div>
          <span>Base unit</span>
          <strong>
            {item.unitOfMeasure.name} ({item.unitOfMeasure.symbol})
          </strong>
        </div>
        <div>
          <span>Quantity precision</span>
          <strong>{item.unitOfMeasure.decimalPrecision} decimal places</strong>
        </div>
        <div>
          <span>Last updated</span>
          <strong>{formatDateTime(item.updatedAt)}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Item details</h2>
        <p>{item.description || "No item description."}</p>
        {!item.active ? (
          <p className="notice">
            This item is inactive and retained for historical traceability.
            Normal hard deletion is not available.
          </p>
        ) : null}
        {canWrite ? (
          <details>
            <summary>Edit item</summary>
            <form
              action={updateItem}
              aria-label={`Edit item ${item.code}`}
              className="form-grid form-grid--wide"
            >
              <input type="hidden" name="itemId" value={item.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={item.version}
              />
              <label>
                Item code
                <input
                  name="code"
                  defaultValue={item.code}
                  required
                  minLength={2}
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Item name
                <input
                  name="name"
                  defaultValue={item.name}
                  required
                  minLength={2}
                  maxLength={200}
                />
              </label>
              <label>
                Category (cannot be changed)
                <input value={item.itemCategory.name} readOnly />
              </label>
              <label>
                Base unit of measure
                <select
                  name="unitOfMeasureId"
                  defaultValue={item.unitOfMeasure.id}
                  required
                >
                  {units
                    .filter(
                      (unit) =>
                        unit.active || unit.id === item.unitOfMeasure.id,
                    )
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.code} — {unit.name} ({unit.symbol})
                        {unit.active ? "" : " — inactive"}
                      </option>
                    ))}
                </select>
              </label>
              <label className="span-all">
                Item description
                <textarea
                  name="description"
                  defaultValue={item.description}
                  rows={3}
                  maxLength={2000}
                />
              </label>
              <SpecificationFields
                attributes={specificationDefinitions.filter(
                  (definition) => definition.active,
                )}
                values={values}
              />
              <button type="submit">Save item</button>
            </form>
          </details>
        ) : null}
      </section>

      <section className="panel">
        <h2>Specifications</h2>
        {specificationDefinitions.length === 0 ? (
          <p>This item category has no structured specifications.</p>
        ) : (
          <table>
            <caption className="visually-hidden">
              Structured specification values for {item.code}
            </caption>
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Value</th>
                <th>Definition status</th>
              </tr>
            </thead>
            <tbody>
              {specificationDefinitions.map((definition) => (
                <tr key={definition.id}>
                  <td>
                    {definition.name}
                    <small>{definition.code}</small>
                  </td>
                  <td>
                    {displaySpecificationValue(values.get(definition.id))}
                    {definition.unitOfMeasure
                      ? ` ${definition.unitOfMeasure.symbol}`
                      : ""}
                  </td>
                  <td>
                    {definition.active ? "Active" : "Inactive"} ·{" "}
                    {definition.required ? "Required" : "Optional"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {canWrite ? (
        <section className="panel panel--danger">
          <h2 id="deactivate-item-title">Deactivate item</h2>
          <p>
            Deactivation removes this item from normal active selection while
            preserving its identifier, specifications, and audit history.
          </p>
          <form
            action={deactivateItem}
            aria-labelledby="deactivate-item-title"
            className="form-grid"
          >
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="expectedVersion" value={item.version} />
            <label>
              Deactivation reason
              <input name="reason" required minLength={5} maxLength={500} />
            </label>
            <button className="button--danger" type="submit">
              Deactivate item
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
