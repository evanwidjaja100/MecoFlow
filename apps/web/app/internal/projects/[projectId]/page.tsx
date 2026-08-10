import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMe } from "../../../lib/api";
import {
  addProjectMember,
  createMilestone,
  createWorkPackage,
  transitionProject,
  updateMilestone,
  updateProject,
  updateProjectMember,
  updateWorkPackage,
} from "../actions";
import {
  dateInput,
  formatDate,
  memberCandidates,
  productCategories,
  projectOverview,
  type ProjectState,
} from "../data";

const transitions: Record<ProjectState, ProjectState[]> = {
  ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
  DRAFT: ["PLANNED", "CANCELLED"],
  ON_HOLD: ["ACTIVE", "CANCELLED"],
  PLANNED: ["ACTIVE", "ON_HOLD", "CANCELLED"],
};

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  const [me, project, categories] = await Promise.all([
    requireMe("INTERNAL"),
    projectOverview(projectId),
    productCategories(),
  ]);
  const terminal = ["COMPLETED", "CANCELLED"].includes(project.state);
  const canWrite =
    !terminal &&
    me.memberships.some((membership) =>
      membership.permissions.includes("project.write"),
    );
  const canManageMembers =
    !terminal &&
    me.memberships.some((membership) =>
      membership.permissions.includes("project.membership.manage"),
    );
  const candidates = canManageMembers ? await memberCandidates(project.id) : [];

  return (
    <main className="workspace">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/internal/projects">Projects</Link>
        <span aria-hidden="true">/</span>
        <span>{project.code}</span>
      </nav>
      <div className="heading-row">
        <div>
          <p className="eyebrow">{project.productCategory.name}</p>
          <h1>{project.name}</h1>
          <p className="lede">
            {project.code} · {project.organization.name}
          </p>
        </div>
        <span className={`status status--${project.state.toLowerCase()}`}>
          {project.state.replace("_", " ")}
        </span>
      </div>

      <section className="summary-grid" aria-label="Project summary">
        <div>
          <span>Planned start</span>
          <strong>{formatDate(project.plannedStartDate)}</strong>
        </div>
        <div>
          <span>Planned end</span>
          <strong>{formatDate(project.plannedEndDate)}</strong>
        </div>
        <div>
          <span>Milestones</span>
          <strong>{project.milestones.length}</strong>
        </div>
        <div>
          <span>Work packages</span>
          <strong>{project.workPackages.length}</strong>
        </div>
      </section>

      {me.memberships.some((membership) =>
        membership.permissions.includes("readiness.read"),
      ) ? (
        <section className="panel">
          <h2>Material readiness</h2>
          <p>
            Review the persisted project and work-package scores together with
            their critical gates, blockers, explanations, and recommended
            actions.
          </p>
          <Link
            className="button"
            href={`/internal/projects/${project.id}/readiness`}
          >
            Open readiness overview
          </Link>
        </section>
      ) : null}

      {me.memberships.some((membership) =>
        membership.permissions.includes("bom.read"),
      ) ? (
        <section className="panel">
          <h2>Bill of materials</h2>
          <p>
            Revision-controlled project and work-package BOMs with secure
            CSV/XLSX dry-run imports.
          </p>
          <Link
            className="button"
            href={`/internal/projects/${project.id}/boms`}
          >
            Open BOM workspace
          </Link>
        </section>
      ) : null}

      {me.memberships.some((membership) =>
        membership.permissions.includes("requisition.read"),
      ) ? (
        <section className="panel">
          <h2>Purchase requisitions</h2>
          <p>
            Create and control purchase requisitions against released BOM need
            with live outstanding quantities.
          </p>
          <Link
            className="button"
            href={`/internal/projects/${project.id}/requisitions`}
          >
            Open requisition workspace
          </Link>
        </section>
      ) : null}

      {me.memberships.some((membership) =>
        membership.permissions.includes("purchase-order.read"),
      ) ? (
        <section className="panel">
          <h2>Purchase orders and commitments</h2>
          <p>
            Convert approved requisitions into supplier-addressed orders and
            monitor commitment revisions and date exceptions.
          </p>
          <Link
            className="button"
            href={`/internal/projects/${project.id}/purchase-orders`}
          >
            Open purchase order workspace
          </Link>
        </section>
      ) : null}

      {me.memberships.some((membership) =>
        membership.permissions.includes("document.read"),
      ) ? (
        <section className="panel">
          <h2>Documents</h2>
          <p>
            Upload private project documents, review clean versions, and retain
            approval and supersede history.
          </p>
          <Link
            className="button"
            href={`/internal/projects/${project.id}/documents`}
          >
            Open document workspace
          </Link>
        </section>
      ) : null}

      {me.memberships.some((membership) =>
        membership.permissions.includes("receiving.read"),
      ) ? (
        <section className="panel">
          <h2>Shipments and receiving</h2>
          <p>
            Process supplier ASNs, arrivals, traceable goods receipts,
            corrections, and awaiting-inspection inventory lots.
          </p>
          <Link
            className="button"
            href={`/internal/projects/${project.id}/receiving`}
          >
            Open receiving workspace
          </Link>
        </section>
      ) : null}

      {me.memberships.some((membership) =>
        membership.permissions.includes("inspection.read"),
      ) ? (
        <section className="panel">
          <h2>Receiving inspections</h2>
          <p>
            Work the QA/QC queue, capture checklist and measurement results,
            review approved certificate evidence, and finalize lot disposition.
          </p>
          <Link
            className="button"
            href={`/internal/projects/${project.id}/inspections`}
          >
            Open inspection work queue
          </Link>
        </section>
      ) : null}

      {me.memberships.some((membership) =>
        membership.permissions.includes("ncr.read"),
      ) ? (
        <section className="panel">
          <h2>NCR and material allocation</h2>
          <p>
            Coordinate supplier corrective responses and allocate accepted,
            traceable inventory to released BOM requirements.
          </p>
          <Link
            className="button"
            href={`/internal/projects/${project.id}/quality`}
          >
            Open quality and allocation workspace
          </Link>
        </section>
      ) : null}

      <section className="panel">
        <h2>Project details</h2>
        <p>{project.description || "No project description."}</p>
        {canWrite ? (
          <details>
            <summary>Edit project</summary>
            <form action={updateProject} className="form-grid form-grid--wide">
              <input type="hidden" name="projectId" value={project.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={project.version}
              />
              <label>
                Project code
                <input
                  name="code"
                  defaultValue={project.code}
                  required
                  maxLength={50}
                />
              </label>
              <label>
                Project name
                <input
                  name="name"
                  defaultValue={project.name}
                  required
                  maxLength={200}
                />
              </label>
              <label>
                Product category
                <select
                  name="productCategoryId"
                  defaultValue={project.productCategory.id}
                >
                  {categories
                    .filter(
                      ({ active, id }) =>
                        active || id === project.productCategory.id,
                    )
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Planned start
                <input
                  type="date"
                  name="plannedStartDate"
                  defaultValue={dateInput(project.plannedStartDate)}
                  required
                />
              </label>
              <label>
                Planned end
                <input
                  type="date"
                  name="plannedEndDate"
                  defaultValue={dateInput(project.plannedEndDate)}
                  required
                />
              </label>
              <label className="span-all">
                Description
                <textarea
                  name="description"
                  defaultValue={project.description}
                  maxLength={2000}
                  rows={3}
                />
              </label>
              <button type="submit">Save project</button>
            </form>
          </details>
        ) : null}
      </section>

      <section className="panel">
        <h2>Lifecycle</h2>
        {canWrite && transitions[project.state].length > 0 ? (
          <form action={transitionProject} className="form-grid">
            <input type="hidden" name="projectId" value={project.id} />
            <input
              type="hidden"
              name="expectedVersion"
              value={project.version}
            />
            <label>
              Target state
              <select name="targetState">
                {transitions[project.state].map((state) => (
                  <option key={state} value={state}>
                    {state.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input name="reason" required minLength={5} maxLength={500} />
            </label>
            <button type="submit">Transition project</button>
          </form>
        ) : (
          <p>
            No standard transition is available from{" "}
            {project.state.replace("_", " ")}.
          </p>
        )}
        <div className="timeline">
          {project.transitions.length === 0 ? (
            <p>
              No transitions recorded. The project remains in its initial draft
              state.
            </p>
          ) : (
            project.transitions.map((transition) => (
              <article key={transition.id}>
                <strong>
                  {transition.sourceState.replace("_", " ")} →{" "}
                  {transition.targetState.replace("_", " ")}
                </strong>
                <span>
                  {formatDate(transition.occurredAt)} ·{" "}
                  {transition.actor.displayName}
                </span>
                <p>{transition.reason}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Milestones</h2>
        {canWrite ? (
          <form action={createMilestone} className="form-grid">
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Code
              <input name="code" required maxLength={50} />
            </label>
            <label>
              Name
              <input name="name" required maxLength={200} />
            </label>
            <label>
              Target date
              <input type="date" name="targetDate" required />
            </label>
            <label>
              Description
              <input name="description" maxLength={1000} />
            </label>
            <button type="submit">Add milestone</button>
          </form>
        ) : null}
        <div className="stack">
          {project.milestones.map((milestone) => (
            <details key={milestone.id}>
              <summary>
                {milestone.code} — {milestone.name} ·{" "}
                {formatDate(milestone.targetDate)}
              </summary>
              <p>{milestone.description || "No description."}</p>
              {canWrite ? (
                <form action={updateMilestone} className="form-grid">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    type="hidden"
                    name="milestoneId"
                    value={milestone.id}
                  />
                  <input
                    type="hidden"
                    name="expectedVersion"
                    value={milestone.version}
                  />
                  <label>
                    Code
                    <input name="code" defaultValue={milestone.code} required />
                  </label>
                  <label>
                    Name
                    <input name="name" defaultValue={milestone.name} required />
                  </label>
                  <label>
                    Target date
                    <input
                      type="date"
                      name="targetDate"
                      defaultValue={dateInput(milestone.targetDate)}
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      name="description"
                      defaultValue={milestone.description}
                    />
                  </label>
                  <button type="submit">Save milestone</button>
                </form>
              ) : null}
            </details>
          ))}
          {project.milestones.length === 0 ? <p>No milestones yet.</p> : null}
        </div>
      </section>

      <section className="panel">
        <h2>Work packages</h2>
        {canWrite ? (
          <form
            action={createWorkPackage}
            className="form-grid form-grid--wide"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Code
              <input name="code" required maxLength={50} />
            </label>
            <label>
              Name
              <input name="name" required maxLength={200} />
            </label>
            <label>
              Milestone
              <select name="milestoneId">
                <option value="">No milestone</option>
                {project.milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.code} — {milestone.name}
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
            <label>
              Description
              <input name="description" maxLength={1000} />
            </label>
            <button type="submit">Add work package</button>
          </form>
        ) : null}
        <div className="stack">
          {project.workPackages.map((workPackage) => (
            <details key={workPackage.id}>
              <summary>
                {workPackage.code} — {workPackage.name} ·{" "}
                {formatDate(workPackage.plannedStartDate)} –{" "}
                {formatDate(workPackage.plannedEndDate)}
              </summary>
              <p>{workPackage.description || "No description."}</p>
              {canWrite ? (
                <form
                  action={updateWorkPackage}
                  className="form-grid form-grid--wide"
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    type="hidden"
                    name="workPackageId"
                    value={workPackage.id}
                  />
                  <input
                    type="hidden"
                    name="expectedVersion"
                    value={workPackage.version}
                  />
                  <label>
                    Code
                    <input
                      name="code"
                      defaultValue={workPackage.code}
                      required
                    />
                  </label>
                  <label>
                    Name
                    <input
                      name="name"
                      defaultValue={workPackage.name}
                      required
                    />
                  </label>
                  <label>
                    Milestone
                    <select
                      name="milestoneId"
                      defaultValue={workPackage.milestoneId ?? ""}
                    >
                      <option value="">No milestone</option>
                      {project.milestones.map((milestone) => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.code} — {milestone.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Planned start
                    <input
                      type="date"
                      name="plannedStartDate"
                      defaultValue={dateInput(workPackage.plannedStartDate)}
                      required
                    />
                  </label>
                  <label>
                    Planned end
                    <input
                      type="date"
                      name="plannedEndDate"
                      defaultValue={dateInput(workPackage.plannedEndDate)}
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      name="description"
                      defaultValue={workPackage.description}
                    />
                  </label>
                  <button type="submit">Save work package</button>
                </form>
              ) : null}
            </details>
          ))}
          {project.workPackages.length === 0 ? (
            <p>No work packages yet.</p>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2>Project members</h2>
        {canManageMembers && candidates.length > 0 ? (
          <form action={addProjectMember} className="form-grid">
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Membership
              <select name="candidate">
                {candidates.map((candidate) => (
                  <option
                    key={candidate.id}
                    value={`${candidate.id}|${candidate.organization.type}`}
                  >
                    {candidate.user.displayName} · {candidate.organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Internal project role
              <select name="role">
                <option value="CONTRIBUTOR">Contributor</option>
                <option value="PROJECT_MANAGER">Project manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </label>
            <button type="submit">Add member</button>
          </form>
        ) : null}
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Organization</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {project.members.map((member) => (
              <tr key={member.id}>
                <td>
                  {member.membership.user.displayName}
                  <small>{member.membership.user.email}</small>
                </td>
                <td>{member.membership.organization.name}</td>
                <td>{member.role.replace("_", " ")}</td>
                <td>{member.status}</td>
                <td>
                  {canManageMembers ? (
                    <form action={updateProjectMember} className="inline-form">
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />
                      <input type="hidden" name="memberId" value={member.id} />
                      <input
                        type="hidden"
                        name="expectedVersion"
                        value={member.version}
                      />
                      <input type="hidden" name="role" value={member.role} />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                        }
                      />
                      <button type="submit">
                        {member.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
