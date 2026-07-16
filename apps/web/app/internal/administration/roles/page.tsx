import { assignRoles } from "../actions";
import { memberships, organizations, roles } from "../data";

export default async function RoleAssignmentsPage() {
  const [organizationItems, roleItems] = await Promise.all([
    organizations(),
    roles(),
  ]);
  const groups = await Promise.all(
    organizationItems.map(async (organization) => ({
      organization,
      items: await memberships(organization.id),
    })),
  );
  return (
    <main className="workspace">
      <p className="eyebrow">Administration</p>
      <h1>Role assignments</h1>
      {groups.flatMap(({ organization, items }) =>
        items.map((membership) => (
          <section className="panel" key={membership.id}>
            <h2>{membership.user.displayName}</h2>
            <p>
              {organization.name} · {membership.user.email}
            </p>
            <form action={assignRoles} className="role-form">
              <input
                type="hidden"
                name="organizationId"
                value={organization.id}
              />
              <input type="hidden" name="membershipId" value={membership.id} />
              <input
                type="hidden"
                name="expectedVersion"
                value={membership.version}
              />
              <fieldset>
                <legend>Seeded roles</legend>
                {roleItems
                  .filter(
                    (role) =>
                      role.scope === "ANY" || role.scope === organization.type,
                  )
                  .map((role) => (
                    <label className="checkbox" key={role.code}>
                      <input
                        type="checkbox"
                        name="roleCodes"
                        value={role.code}
                        defaultChecked={membership.roles.some(
                          (assigned) => assigned.roleCode === role.code,
                        )}
                      />
                      {role.name}
                    </label>
                  ))}
              </fieldset>
              <button type="submit">Save role assignments</button>
            </form>
          </section>
        )),
      )}
    </main>
  );
}
