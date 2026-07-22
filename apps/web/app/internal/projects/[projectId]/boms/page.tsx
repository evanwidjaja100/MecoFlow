import Link from "next/link";
import { notFound } from "next/navigation";
import { apiBaseUrl, requireMe } from "../../../../lib/api";
import { projectOverview } from "../../data";
import { uploadBom } from "./actions";
import { bomWorkspace } from "./data";

export default async function BomWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const [me, project, workspace] = await Promise.all([
    requireMe("INTERNAL"),
    projectOverview(projectId),
    bomWorkspace(projectId),
  ]);
  const canImport = me.memberships.some((membership) =>
    membership.permissions.includes("bom.import"),
  );
  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/internal/projects/${project.id}`}>{project.code}</Link>
        <span aria-hidden="true">/</span>
        <span>BOMs</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Phase 3B</p>
          <h1>BOM revisions</h1>
          <p className="lede">
            {project.name} · project-wide and work-package-controlled material
            requirements.
          </p>
        </div>
        <span className="badge">{workspace.boms.length} BOM scopes</span>
      </div>

      {canImport ? (
        <section className="panel">
          <div className="heading-row">
            <div>
              <h2>Import a BOM</h2>
              <p>
                Uploads are private and parsed in the background. A dry run with
                every row, error, and warning must be confirmed before a draft
                revision is created.
              </p>
            </div>
            <div className="heading-actions">
              <a
                className="button button--secondary"
                href={`${apiBaseUrl}/api/v1/projects/${project.id}/bom-import-template.csv`}
              >
                CSV template
              </a>
              <a
                className="button button--secondary"
                href={`${apiBaseUrl}/api/v1/projects/${project.id}/bom-import-template.xlsx`}
              >
                XLSX template
              </a>
            </div>
          </div>
          <form
            action={uploadBom}
            aria-label="Upload BOM import"
            className="form-grid"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Scope
              <select name="workPackageId" defaultValue="">
                <option value="">Whole project</option>
                {project.workPackages.map((workPackage) => (
                  <option key={workPackage.id} value={workPackage.id}>
                    {workPackage.code} — {workPackage.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              CSV or XLSX file (maximum 5 MiB)
              <input
                accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                name="file"
                required
                type="file"
              />
            </label>
            <button type="submit">Upload and validate</button>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <h2>Import history</h2>
        {workspace.imports.length === 0 ? (
          <p>No BOM import has been uploaded for this project.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Scope</th>
                <th>Status</th>
                <th>Rows</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              {workspace.imports.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <Link
                      href={`/internal/projects/${project.id}/boms/imports/${entry.id}`}
                    >
                      {entry.sourceFile.originalFileName}
                    </Link>
                    <small>
                      SHA-256 {entry.sourceFile.sha256.slice(0, 12)}…
                    </small>
                  </td>
                  <td>{entry.workPackage?.code ?? "Whole project"}</td>
                  <td>
                    <span
                      className={`status status--${entry.status.toLowerCase()}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td>{entry.rowCount}</td>
                  <td>
                    {entry.errorCount} errors · {entry.warningCount} warnings
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>Revision register</h2>
        {workspace.boms.length === 0 ? (
          <p>
            No draft BOM revision exists. Confirm a valid dry run to create one.
          </p>
        ) : (
          <div className="stack">
            {workspace.boms.map((bom) => (
              <article className="subpanel" key={bom.id}>
                <h3>
                  {bom.workPackage
                    ? `${bom.workPackage.code} — ${bom.workPackage.name}`
                    : "Whole project"}
                </h3>
                <table>
                  <thead>
                    <tr>
                      <th>Revision</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Compare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bom.revisions.map((revision, index) => (
                      <tr key={revision.id}>
                        <td>
                          <Link
                            href={`/internal/projects/${project.id}/boms/revisions/${revision.id}`}
                          >
                            R{revision.revisionNumber}
                          </Link>
                        </td>
                        <td>{revision.title}</td>
                        <td>
                          <span
                            className={`status status--${revision.status.toLowerCase()}`}
                          >
                            {revision.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          {bom.revisions[index + 1] ? (
                            <Link
                              href={`/internal/projects/${project.id}/boms/compare?bomId=${bom.id}&from=${bom.revisions[index + 1]!.id}&to=${revision.id}`}
                            >
                              Compare with R
                              {bom.revisions[index + 1]!.revisionNumber}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
