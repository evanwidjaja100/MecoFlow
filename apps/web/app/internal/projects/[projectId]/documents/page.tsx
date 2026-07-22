import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../../lib/api";
import {
  approveDocument,
  downloadDocument,
  rejectDocument,
  submitDocumentReview,
  supersedeDocument,
  uploadDocument,
} from "./actions";
import { projectDocuments } from "./data";

function can(me: Awaited<ReturnType<typeof requireMe>>, permission: string) {
  return me.memberships.some((membership) =>
    membership.permissions.includes(permission),
  );
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const [me, documents] = await Promise.all([
    requireMe("INTERNAL"),
    projectDocuments(projectId),
  ]);
  const canUpload = can(me, "document.upload");
  const canApprove = can(me, "document.approve");

  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/internal/projects/${projectId}`}>Project</Link>
        <span aria-hidden="true">/</span>
        <span>Documents</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">Private document storage</p>
          <h1>Project documents</h1>
          <p className="lede">
            Quarantined, checksum-verified versions with malware scanning and
            retained approval history.
          </p>
        </div>
      </div>

      {canUpload ? (
        <section className="panel">
          <h2>Upload document</h2>
          <p>
            Allowed: PDF, PNG, JPEG, TXT, and CSV. ZIP files are prohibited.
          </p>
          <form
            action={uploadDocument}
            aria-label="Upload project document"
            className="form-grid form-grid--wide"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <label>
              Title
              <input name="title" required minLength={2} maxLength={200} />
            </label>
            <label>
              Category
              <input name="category" required minLength={2} maxLength={100} />
            </label>
            <label>
              File
              <input
                name="file"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
              />
            </label>
            <label className="span-all">
              Description
              <textarea name="description" maxLength={2000} rows={3} />
            </label>
            <button type="submit">Upload to quarantine</button>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <h2>Document register</h2>
        {documents.length === 0 ? (
          <p>No documents have been uploaded.</p>
        ) : null}
        <div className="stack">
          {documents.map((document) => {
            const current = document.versions[0]!;
            return (
              <details key={document.id} open={documents.length === 1}>
                <summary>
                  {document.title} · v{current.versionNumber} ·{" "}
                  {current.status.replace("_", " ")}
                </summary>
                <p>
                  {document.category} · {document.ownerOrganization.name} ·{" "}
                  {current.originalFileName}
                </p>
                <p>{document.description || "No description."}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>File security</th>
                      <th>Workflow</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.versions.map((version) => (
                      <tr key={version.id}>
                        <td>
                          v{version.versionNumber}
                          <small>{version.originalFileName}</small>
                          <small>
                            {version.byteSize.toLocaleString()} bytes
                          </small>
                        </td>
                        <td>
                          {version.scanStatus}
                          <small>
                            {version.detectedMimeType ??
                              "Awaiting verification"}
                          </small>
                          <small className="checksum">
                            SHA-256 {version.sha256}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`status status--${version.status.toLowerCase()}`}
                          >
                            {version.status.replace("_", " ")}
                          </span>
                          {version.reviewedBy ? (
                            <small>
                              Reviewed by {version.reviewedBy.displayName}
                            </small>
                          ) : null}
                          {version.reviewReason ? (
                            <small>{version.reviewReason}</small>
                          ) : null}
                        </td>
                        <td>
                          {version.status === "DRAFT" && canUpload ? (
                            <form
                              action={submitDocumentReview}
                              className="inline-form"
                            >
                              <input
                                type="hidden"
                                name="projectId"
                                value={projectId}
                              />
                              <input
                                type="hidden"
                                name="versionId"
                                value={version.id}
                              />
                              <input
                                type="hidden"
                                name="expectedVersion"
                                value={version.version}
                              />
                              <input
                                name="reason"
                                required
                                minLength={5}
                                maxLength={500}
                                placeholder="Review reason"
                              />
                              <button type="submit">Submit review</button>
                            </form>
                          ) : null}
                          {version.status === "IN_REVIEW" && canApprove ? (
                            <div className="stack">
                              <form
                                action={approveDocument}
                                className="inline-form"
                              >
                                <input
                                  type="hidden"
                                  name="projectId"
                                  value={projectId}
                                />
                                <input
                                  type="hidden"
                                  name="versionId"
                                  value={version.id}
                                />
                                <input
                                  type="hidden"
                                  name="expectedVersion"
                                  value={version.version}
                                />
                                <input
                                  name="reason"
                                  required
                                  minLength={5}
                                  maxLength={500}
                                  placeholder="Approval reason"
                                />
                                <button type="submit">Approve</button>
                              </form>
                              <form
                                action={rejectDocument}
                                className="inline-form"
                              >
                                <input
                                  type="hidden"
                                  name="projectId"
                                  value={projectId}
                                />
                                <input
                                  type="hidden"
                                  name="versionId"
                                  value={version.id}
                                />
                                <input
                                  type="hidden"
                                  name="expectedVersion"
                                  value={version.version}
                                />
                                <input
                                  name="reason"
                                  required
                                  minLength={5}
                                  maxLength={500}
                                  placeholder="Rejection reason"
                                />
                                <button
                                  type="submit"
                                  className="button--danger"
                                >
                                  Reject
                                </button>
                              </form>
                            </div>
                          ) : null}
                          {version.scanStatus === "CLEAN" &&
                          ["APPROVED", "IN_REVIEW"].includes(version.status) ? (
                            <form
                              action={downloadDocument}
                              className="inline-form"
                            >
                              <input
                                type="hidden"
                                name="versionId"
                                value={version.id}
                              />
                              <button type="submit">Download</button>
                            </form>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {canUpload && current.status === "APPROVED" ? (
                  <form action={supersedeDocument} className="form-grid">
                    <input type="hidden" name="projectId" value={projectId} />
                    <input
                      type="hidden"
                      name="documentId"
                      value={document.id}
                    />
                    <input
                      type="hidden"
                      name="expectedDocumentVersion"
                      value={document.version}
                    />
                    <label>
                      Replacement file
                      <input
                        name="file"
                        type="file"
                        required
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                      />
                    </label>
                    <label>
                      Supersede reason
                      <input
                        name="reason"
                        required
                        minLength={5}
                        maxLength={500}
                      />
                    </label>
                    <button type="submit">Create replacement version</button>
                  </form>
                ) : null}
              </details>
            );
          })}
        </div>
      </section>
    </main>
  );
}
