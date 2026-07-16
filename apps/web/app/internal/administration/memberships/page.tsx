import { createMembership, updateMembershipStatus } from "../actions";
import { memberships, organizations, users } from "../data";

export default async function MembershipsPage() {
  const [organizationItems, userItems] = await Promise.all([
    organizations(),
    users(),
  ]);
  const membershipGroups = await Promise.all(
    organizationItems.map(async (organization) => ({
      organization,
      items: await memberships(organization.id),
    })),
  );
  return (
    <main className="workspace">
      <p className="eyebrow">Administration</p>
      <h1>Memberships</h1>
      <section className="panel">
        <h2>Create membership</h2>
        <form action={createMembership} className="form-grid">
          <label>
            Organization
            <select name="organizationId">
              {organizationItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            User
            <select name="userId">
              {userItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.email} ({item.status})
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Create membership</button>
        </form>
      </section>
      {membershipGroups.map(({ organization, items }) => (
        <section className="panel" key={organization.id}>
          <h2>{organization.name}</h2>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Roles</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.user.email}</td>
                  <td>{item.status}</td>
                  <td>
                    {item.roles.map((role) => role.roleCode).join(", ") ||
                      "No roles"}
                  </td>
                  <td>
                    <form action={updateMembershipStatus}>
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organization.id}
                      />
                      <input
                        type="hidden"
                        name="membershipId"
                        value={item.id}
                      />
                      <input
                        type="hidden"
                        name="expectedVersion"
                        value={item.version}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value={item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                      />
                      <button type="submit">
                        {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
