import { createOrganization } from "../actions";
import { organizations } from "../data";

export default async function OrganizationsPage() {
  const items = await organizations();
  return (
    <main className="workspace">
      <p className="eyebrow">Administration</p>
      <h1>Organizations</h1>
      <section className="panel">
        <h2>Create organization</h2>
        <form action={createOrganization} className="form-grid">
          <label>
            Code
            <input
              name="code"
              required
              maxLength={50}
              pattern="[A-Za-z0-9-]+"
            />
          </label>
          <label>
            Name
            <input name="name" required maxLength={200} />
          </label>
          <label>
            Type
            <select name="type">
              <option value="INTERNAL">Internal</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </label>
          <button type="submit">Create organization</button>
        </form>
      </section>
      <section className="panel">
        <h2>Organization directory</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
