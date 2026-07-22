import Link from "next/link";
import { requireMe } from "../../lib/api";
import {
  createProductCategory,
  createProject,
  updateProductCategory,
} from "./actions";
import { formatDate, productCategories, projectList } from "./data";

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
    "categoryId",
    "direction",
    "page",
    "pageSize",
    "q",
    "sort",
    "state",
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
  return `/internal/projects?${next.toString()}`;
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
  return `/internal/projects?${next.toString()}`;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [me, rawParams, categories] = await Promise.all([
    requireMe("INTERNAL"),
    searchParams,
    productCategories(),
  ]);
  const params = query(rawParams);
  const projects = await projectList(params);
  const writeMembership = me.memberships.find(
    (membership) =>
      membership.organization.type === "INTERNAL" &&
      membership.permissions.includes("project.write"),
  );
  const canWrite = Boolean(writeMembership);

  return (
    <main className="workspace">
      <p className="eyebrow">Phase 2</p>
      <div className="heading-row">
        <div>
          <h1>Projects</h1>
          <p className="lede">
            Authorized projects, milestones, work packages, and lifecycle state.
          </p>
        </div>
        <span className="badge">{projects.pagination.total} projects</span>
      </div>

      <section className="panel">
        <h2>Filter projects</h2>
        <form action="/internal/projects" className="form-grid" method="get">
          <label>
            Search
            <input
              name="q"
              defaultValue={params.get("q") ?? ""}
              maxLength={100}
            />
          </label>
          <label>
            State
            <select name="state" defaultValue={params.get("state") ?? ""}>
              <option value="">All states</option>
              {[
                "DRAFT",
                "PLANNED",
                "ACTIVE",
                "ON_HOLD",
                "COMPLETED",
                "CANCELLED",
              ].map((state) => (
                <option key={state} value={state}>
                  {state.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product category
            <select
              name="categoryId"
              defaultValue={params.get("categoryId") ?? ""}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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
          <Link className="button button--secondary" href="/internal/projects">
            Clear filters
          </Link>
        </form>
      </section>

      <section className="panel">
        <h2>Project directory</h2>
        {projects.data.length === 0 ? (
          <p>No authorized projects match these filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  <Link href={sortLink(params, "code")}>Code</Link>
                </th>
                <th>
                  <Link href={sortLink(params, "name")}>Project</Link>
                </th>
                <th>Category</th>
                <th>
                  <Link href={sortLink(params, "state")}>State</Link>
                </th>
                <th>
                  <Link href={sortLink(params, "plannedStartDate")}>Dates</Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.data.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link href={`/internal/projects/${project.id}`}>
                      {project.code}
                    </Link>
                  </td>
                  <td>{project.name}</td>
                  <td>{project.productCategory.name}</td>
                  <td>
                    <span
                      className={`status status--${project.state.toLowerCase()}`}
                    >
                      {project.state.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {formatDate(project.plannedStartDate)} –{" "}
                    {formatDate(project.plannedEndDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <nav className="pagination" aria-label="Project pages">
          {projects.pagination.page > 1 ? (
            <Link href={pageLink(params, projects.pagination.page - 1)}>
              Previous
            </Link>
          ) : (
            <span>Previous</span>
          )}
          <span>
            Page {projects.pagination.page} of{" "}
            {Math.max(1, projects.pagination.totalPages)}
          </span>
          {projects.pagination.page < projects.pagination.totalPages ? (
            <Link href={pageLink(params, projects.pagination.page + 1)}>
              Next
            </Link>
          ) : (
            <span>Next</span>
          )}
        </nav>
      </section>

      {canWrite && writeMembership ? (
        <>
          <section className="panel" id="create-project">
            <h2>Create project</h2>
            <form action={createProject} className="form-grid form-grid--wide">
              <input
                type="hidden"
                name="organizationId"
                value={writeMembership.organization.id}
              />
              <label>
                Project code
                <input
                  name="code"
                  required
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Project name
                <input name="name" required maxLength={200} />
              </label>
              <label>
                Product category
                <select name="productCategoryId" required>
                  {categories
                    .filter(({ active }) => active)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Planned start
                <input type="date" name="plannedStartDate" required />
              </label>
              <label>
                Planned end
                <input type="date" name="plannedEndDate" required />
              </label>
              <label className="span-all">
                Description
                <textarea name="description" maxLength={2000} rows={3} />
              </label>
              <button type="submit">Create project</button>
            </form>
          </section>

          <section className="panel">
            <h2>Product categories</h2>
            <form action={createProductCategory} className="form-grid">
              <label>
                Code
                <input
                  name="code"
                  required
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                />
              </label>
              <label>
                Name
                <input name="name" required maxLength={150} />
              </label>
              <label>
                Description
                <input name="description" maxLength={500} />
              </label>
              <button type="submit">Add category</button>
            </form>
            <div className="stack">
              {categories.map((category) => (
                <details key={category.id}>
                  <summary>
                    {category.code} — {category.name} (
                    {category.active ? "Active" : "Inactive"})
                  </summary>
                  <form action={updateProductCategory} className="form-grid">
                    <input
                      type="hidden"
                      name="categoryId"
                      value={category.id}
                    />
                    <input
                      type="hidden"
                      name="expectedVersion"
                      value={category.version}
                    />
                    <label>
                      Code
                      <input
                        name="code"
                        defaultValue={category.code}
                        required
                      />
                    </label>
                    <label>
                      Name
                      <input
                        name="name"
                        defaultValue={category.name}
                        required
                      />
                    </label>
                    <label>
                      Description
                      <input
                        name="description"
                        defaultValue={category.description}
                      />
                    </label>
                    <label>
                      Status
                      <select
                        name="active"
                        defaultValue={String(category.active)}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </label>
                    <button type="submit">Save category</button>
                  </form>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
