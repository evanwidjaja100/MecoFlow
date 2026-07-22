import Link from "next/link";
import { requireMe } from "../../lib/api";
import {
  createItem,
  createItemCategory,
  createSpecificationAttribute,
  createUnitOfMeasure,
  updateItemCategory,
  updateSpecificationAttribute,
  updateUnitOfMeasure,
} from "./actions";
import {
  formatDateTime,
  itemCategories,
  itemList,
  unitsOfMeasure,
  type ItemCategory,
  type SpecificationAttributeDefinition,
  type UnitOfMeasure,
} from "./data";
import { SpecificationFields } from "./specification-fields";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(
  input: Record<string, string | string[] | undefined>,
  key: string,
  fallback = "",
): string {
  const candidate = input[key];
  return typeof candidate === "string" ? candidate : fallback;
}

function query(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const key of [
    "active",
    "categoryId",
    "direction",
    "page",
    "pageSize",
    "q",
    "sort",
    "unitOfMeasureId",
  ]) {
    const candidate = value(input, key);
    if (candidate) params.set(key, candidate);
  }
  if (!params.has("page")) params.set("page", "1");
  if (!params.has("pageSize")) params.set("pageSize", "20");
  return params;
}

function pageLink(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/internal/items?${next.toString()}`;
}

function sortLink(params: URLSearchParams, sort: string): string {
  const next = new URLSearchParams(params);
  const same = next.get("sort") === sort;
  next.set("sort", sort);
  next.set(
    "direction",
    same && next.get("direction") !== "desc" ? "desc" : "asc",
  );
  next.set("page", "1");
  return `/internal/items?${next.toString()}`;
}

function exportLink(params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  next.delete("page");
  next.delete("pageSize");
  const suffix = next.toString();
  return `/internal/items/export${suffix ? `?${suffix}` : ""}`;
}

function ariaSort(
  params: URLSearchParams,
  column: string,
): "ascending" | "descending" | "none" {
  if ((params.get("sort") ?? "code") !== column) return "none";
  return params.get("direction") === "desc" ? "descending" : "ascending";
}

function UnitOptions({
  units,
  selectedId,
}: {
  units: UnitOfMeasure[];
  selectedId?: string | null;
}) {
  return units
    .filter((unit) => unit.active || unit.id === selectedId)
    .map((unit) => (
      <option key={unit.id} value={unit.id}>
        {unit.code} — {unit.name} ({unit.symbol})
        {unit.active ? "" : " — inactive"}
      </option>
    ));
}

function SpecificationDefinitionFields({
  attribute,
  units,
}: {
  attribute?: SpecificationAttributeDefinition;
  units: UnitOfMeasure[];
}) {
  return (
    <>
      <label>
        Attribute code
        <input
          name="attributeCode"
          defaultValue={attribute?.code}
          required
          minLength={1}
          maxLength={50}
          pattern="[A-Za-z0-9._-]+"
        />
      </label>
      <label>
        Attribute name
        <input
          name="attributeName"
          defaultValue={attribute?.name}
          required
          minLength={2}
          maxLength={150}
        />
      </label>
      <label>
        Data type
        <select name="dataType" defaultValue={attribute?.dataType ?? "TEXT"}>
          <option value="TEXT">Text</option>
          <option value="NUMBER">Number</option>
          <option value="BOOLEAN">Yes / no</option>
        </select>
      </label>
      <label>
        Number unit (optional)
        <select
          name="attributeUnitOfMeasureId"
          defaultValue={attribute?.unitOfMeasureId ?? ""}
        >
          <option value="">No unit</option>
          <UnitOptions
            units={units}
            selectedId={attribute?.unitOfMeasureId ?? null}
          />
        </select>
      </label>
      <label>
        Number decimal precision
        <input
          type="number"
          name="attributeDecimalPrecision"
          min={0}
          max={6}
          defaultValue={attribute?.decimalPrecision ?? 0}
        />
      </label>
      <label>
        Sort order
        <input
          type="number"
          name="attributeSortOrder"
          min={0}
          max={10000}
          defaultValue={attribute?.sortOrder ?? 0}
          required
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="attributeRequired"
          value="true"
          defaultChecked={attribute?.required}
        />
        Required for items
      </label>
      {attribute ? (
        <label>
          Attribute status
          <select
            name="attributeActive"
            defaultValue={String(attribute.active)}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      ) : null}
      <label className="span-all">
        Attribute description
        <textarea
          name="attributeDescription"
          defaultValue={attribute?.description}
          rows={2}
          maxLength={500}
        />
      </label>
    </>
  );
}

function CreateItems({
  categories,
  units,
}: {
  categories: ItemCategory[];
  units: UnitOfMeasure[];
}) {
  const activeCategories = categories.filter(({ active }) => active);
  const activeUnits = units.filter(({ active }) => active);
  if (activeCategories.length === 0 || activeUnits.length === 0) {
    return (
      <p>
        Create at least one active item category and unit of measure before
        creating an item.
      </p>
    );
  }
  return (
    <div className="stack">
      {activeCategories.map((category) => {
        const titleId = `create-item-${category.id}`;
        return (
          <details key={category.id}>
            <summary>
              {category.code} — {category.name}
            </summary>
            <form
              action={createItem}
              aria-labelledby={titleId}
              className="form-grid form-grid--wide"
            >
              <h3 className="span-all" id={titleId}>
                New {category.name} item
              </h3>
              <input type="hidden" name="itemCategoryId" value={category.id} />
              <label>
                Item code
                <input
                  name="code"
                  required
                  minLength={2}
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Item name
                <input name="name" required minLength={2} maxLength={200} />
              </label>
              <label>
                Base unit of measure
                <select name="unitOfMeasureId" required>
                  <UnitOptions units={activeUnits} />
                </select>
              </label>
              <label className="span-all">
                Item description
                <textarea name="description" rows={3} maxLength={2000} />
              </label>
              <SpecificationFields
                attributes={category.specificationAttributes.filter(
                  ({ active }) => active,
                )}
              />
              <button type="submit">Create item</button>
            </form>
          </details>
        );
      })}
    </div>
  );
}

function UnitAdministration({ units }: { units: UnitOfMeasure[] }) {
  return (
    <section className="panel">
      <h2>Units of measure</h2>
      <form
        action={createUnitOfMeasure}
        aria-label="Create unit of measure"
        className="form-grid"
      >
        <label>
          Unit code
          <input
            name="unitCode"
            required
            minLength={1}
            maxLength={30}
            pattern="[A-Za-z0-9._-]+"
          />
        </label>
        <label>
          Unit name
          <input name="unitName" required minLength={2} maxLength={100} />
        </label>
        <label>
          Symbol
          <input name="unitSymbol" required maxLength={20} />
        </label>
        <label>
          Decimal precision
          <input
            type="number"
            name="unitDecimalPrecision"
            min={0}
            max={6}
            defaultValue={0}
            required
          />
        </label>
        <button type="submit">Add unit</button>
      </form>
      <div className="stack">
        {units.map((unit) => (
          <details key={unit.id}>
            <summary>
              {unit.code} — {unit.name} ({unit.symbol}) —{" "}
              {unit.active ? "Active" : "Inactive"}
            </summary>
            <form
              action={updateUnitOfMeasure}
              aria-label={`Edit unit ${unit.code}`}
              className="form-grid"
            >
              <input type="hidden" name="unitOfMeasureId" value={unit.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={unit.version}
              />
              <label>
                Unit code
                <input
                  name="unitCode"
                  defaultValue={unit.code}
                  required
                  minLength={1}
                  maxLength={30}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Unit name
                <input
                  name="unitName"
                  defaultValue={unit.name}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label>
                Symbol
                <input
                  name="unitSymbol"
                  defaultValue={unit.symbol}
                  required
                  minLength={1}
                  maxLength={20}
                />
              </label>
              <label>
                Decimal precision
                <input
                  type="number"
                  name="unitDecimalPrecision"
                  min={0}
                  max={6}
                  defaultValue={unit.decimalPrecision}
                  required
                />
              </label>
              <label>
                Unit status
                <select name="unitActive" defaultValue={String(unit.active)}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
              <button type="submit">Save unit</button>
            </form>
          </details>
        ))}
      </div>
    </section>
  );
}

function CategoryAdministration({
  categories,
  units,
}: {
  categories: ItemCategory[];
  units: UnitOfMeasure[];
}) {
  return (
    <section className="panel">
      <h2>Item categories and specification definitions</h2>
      <form
        action={createItemCategory}
        aria-label="Create item category"
        className="form-grid"
      >
        <label>
          Category code
          <input
            name="categoryCode"
            required
            minLength={2}
            maxLength={50}
            pattern="[A-Za-z0-9._-]+"
          />
        </label>
        <label>
          Category name
          <input name="categoryName" required minLength={2} maxLength={150} />
        </label>
        <label>
          Category description
          <input name="categoryDescription" maxLength={500} />
        </label>
        <button type="submit">Add category</button>
      </form>
      <div className="stack">
        {categories.map((category) => (
          <details key={category.id}>
            <summary>
              {category.code} — {category.name} —{" "}
              {category.active ? "Active" : "Inactive"}
            </summary>
            <form
              action={updateItemCategory}
              aria-label={`Edit category ${category.code}`}
              className="form-grid"
            >
              <input type="hidden" name="categoryId" value={category.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={category.version}
              />
              <label>
                Category code
                <input
                  name="categoryCode"
                  defaultValue={category.code}
                  required
                  minLength={2}
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Category name
                <input
                  name="categoryName"
                  defaultValue={category.name}
                  required
                  minLength={2}
                  maxLength={150}
                />
              </label>
              <label>
                Category description
                <input
                  name="categoryDescription"
                  defaultValue={category.description}
                  maxLength={500}
                />
              </label>
              <label>
                Category status
                <select
                  name="categoryActive"
                  defaultValue={String(category.active)}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
              <button type="submit">Save category</button>
            </form>

            <h3>Specification attributes</h3>
            {category.active ? (
              <form
                action={createSpecificationAttribute}
                aria-label={`Add specification attribute to ${category.name}`}
                className="form-grid form-grid--wide"
              >
                <input type="hidden" name="categoryId" value={category.id} />
                <SpecificationDefinitionFields units={units} />
                <button type="submit">Add specification attribute</button>
              </form>
            ) : (
              <p>Reactivate this category before adding definitions.</p>
            )}
            <div className="stack">
              {category.specificationAttributes.map((attribute) => (
                <details key={attribute.id}>
                  <summary>
                    {attribute.code} — {attribute.name} ({attribute.dataType}) —{" "}
                    {attribute.active ? "Active" : "Inactive"}
                  </summary>
                  <form
                    action={updateSpecificationAttribute}
                    aria-label={`Edit specification attribute ${attribute.code}`}
                    className="form-grid form-grid--wide"
                  >
                    <input
                      type="hidden"
                      name="categoryId"
                      value={category.id}
                    />
                    <input
                      type="hidden"
                      name="attributeDefinitionId"
                      value={attribute.id}
                    />
                    <input
                      type="hidden"
                      name="expectedVersion"
                      value={attribute.version}
                    />
                    <SpecificationDefinitionFields
                      attribute={attribute}
                      units={units}
                    />
                    <button type="submit">Save specification attribute</button>
                  </form>
                </details>
              ))}
              {category.specificationAttributes.length === 0 ? (
                <p>No specification attributes yet.</p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [me, rawParams, categories, units] = await Promise.all([
    requireMe("INTERNAL"),
    searchParams,
    itemCategories(),
    unitsOfMeasure(),
  ]);
  const params = query(rawParams);
  const items = await itemList(params);
  const canWrite = me.memberships.some((membership) =>
    membership.permissions.includes("item.write"),
  );
  const canExport = me.memberships.some((membership) =>
    membership.permissions.includes("item.export"),
  );

  return (
    <main className="workspace">
      <p className="eyebrow">Phase 3A</p>
      <div className="heading-row">
        <div>
          <h1>Items</h1>
          <p className="lede">
            Search the internal item master, structured specifications, and
            approved units of measure.
          </p>
        </div>
        <div className="heading-actions">
          <span className="badge">{items.pagination.total} items</span>
          {canExport ? (
            <a
              className="button button--secondary"
              download
              href={exportLink(params)}
            >
              Export CSV
            </a>
          ) : null}
        </div>
      </div>

      <section className="panel">
        <h2>Filter items</h2>
        <form action="/internal/items" className="form-grid" method="get">
          <label>
            Search
            <input
              type="search"
              name="q"
              defaultValue={params.get("q") ?? ""}
              maxLength={100}
            />
          </label>
          <label>
            Category
            <select
              name="categoryId"
              defaultValue={params.get("categoryId") ?? ""}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.code} — {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unit of measure
            <select
              name="unitOfMeasureId"
              defaultValue={params.get("unitOfMeasureId") ?? ""}
            >
              <option value="">All units</option>
              <UnitOptions
                units={units}
                selectedId={params.get("unitOfMeasureId")}
              />
            </select>
          </label>
          <label>
            Status
            <select name="active" defaultValue={params.get("active") ?? ""}>
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label>
            Page size
            <select
              name="pageSize"
              defaultValue={params.get("pageSize") ?? "20"}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <input
            type="hidden"
            name="sort"
            value={params.get("sort") ?? "code"}
          />
          <input
            type="hidden"
            name="direction"
            value={params.get("direction") ?? "asc"}
          />
          <button type="submit">Apply filters</button>
          <Link className="button button--secondary" href="/internal/items">
            Clear filters
          </Link>
        </form>
      </section>

      <section className="panel">
        <h2>Item directory</h2>
        {items.data.length === 0 ? (
          <p>No items match these filters.</p>
        ) : (
          <table>
            <caption className="visually-hidden">
              Authorized item-master results
            </caption>
            <thead>
              <tr>
                <th aria-sort={ariaSort(params, "code")}>
                  <Link href={sortLink(params, "code")}>Code</Link>
                </th>
                <th aria-sort={ariaSort(params, "name")}>
                  <Link href={sortLink(params, "name")}>Item</Link>
                </th>
                <th>Category</th>
                <th>Base unit</th>
                <th>Status</th>
                <th aria-sort={ariaSort(params, "updatedAt")}>
                  <Link href={sortLink(params, "updatedAt")}>Updated</Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/internal/items/${item.id}`}>{item.code}</Link>
                  </td>
                  <td>{item.name}</td>
                  <td>{item.itemCategory.name}</td>
                  <td>
                    {item.unitOfMeasure.name} ({item.unitOfMeasure.symbol})
                  </td>
                  <td>
                    <span
                      className={`status status--${item.active ? "active" : "inactive"}`}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDateTime(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <nav className="pagination" aria-label="Item pages">
          {items.pagination.page > 1 ? (
            <Link href={pageLink(params, items.pagination.page - 1)}>
              Previous
            </Link>
          ) : (
            <span>Previous</span>
          )}
          <span>
            Page {items.pagination.page} of{" "}
            {Math.max(1, items.pagination.totalPages)}
          </span>
          {items.pagination.page < items.pagination.totalPages ? (
            <Link href={pageLink(params, items.pagination.page + 1)}>Next</Link>
          ) : (
            <span>Next</span>
          )}
        </nav>
      </section>

      {canWrite ? (
        <>
          <section className="panel" id="create-item">
            <h2>Create item</h2>
            <p>
              Select a category below. Category-specific specification fields
              are validated when the item is saved.
            </p>
            <CreateItems categories={categories} units={units} />
          </section>
          <CategoryAdministration categories={categories} units={units} />
          <UnitAdministration units={units} />
        </>
      ) : null}
    </main>
  );
}
