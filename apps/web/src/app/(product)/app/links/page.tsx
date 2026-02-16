import { createLinkAction } from "@/lib/actions/link-actions";
import { hasRequiredRole } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { getWorkspaceApps, getWorkspaceLinks } from "@/lib/links";

const trackingBase =
  process.env.NEXT_PUBLIC_TRACKING_BASE_URL ?? "http://localhost:3000";

export default async function LinksPage() {
  const { membership } = await requireActiveMembership();
  const [apps, links] = await Promise.all([
    getWorkspaceApps(membership.workspaceId),
    getWorkspaceLinks(membership.workspaceId),
  ]);
  const canCreate = hasRequiredRole(membership.role, "ANALYST");

  return (
    <div className="stack">
      <section className="panel">
        <h1 className="app-heading">Links</h1>
        <p className="app-subheading">
          Create and manage campaign links. Each click and install can be
          attributed back to these metadata dimensions.
        </p>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Create Tracking Link</h2>
        <p className="app-subheading">
          Required fields: app, source, channel, campaign.
        </p>

        <form action={createLinkAction} className="stack">
          <div className="form-grid">
            <label>
              App
              <select className="input" name="app_id" required disabled={!canCreate}>
                <option value="">Select app</option>
                {apps.map((app) => (
                  <option value={app.id} key={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Source
              <input
                className="input"
                name="source"
                placeholder="tiktok"
                required
                disabled={!canCreate}
              />
            </label>

            <label>
              Channel
              <input
                className="input"
                name="channel"
                placeholder="paid_social"
                required
                disabled={!canCreate}
              />
            </label>

            <label>
              Campaign
              <input
                className="input"
                name="campaign"
                placeholder="us_q1_acq_launch"
                required
                disabled={!canCreate}
              />
            </label>

            <label>
              Adset (optional)
              <input
                className="input"
                name="adset"
                placeholder="lookalike_a"
                disabled={!canCreate}
              />
            </label>

            <label>
              Creative (optional)
              <input
                className="input"
                name="creative"
                placeholder="video_a_15s"
                disabled={!canCreate}
              />
            </label>

            <label>
              Influencer ID (optional)
              <input
                className="input"
                name="influencer_id"
                placeholder="mila_fit_102"
                disabled={!canCreate}
              />
            </label>

            <label>
              Destination URL (optional)
              <input
                className="input"
                name="destination_url"
                placeholder="https://yourdomain.com/download"
                disabled={!canCreate}
              />
            </label>
          </div>

          <div>
            <button
              className="button button-primary"
              type="submit"
              disabled={!canCreate || apps.length === 0}
            >
              Create Link
            </button>
          </div>
        </form>

        {!canCreate ? (
          <p className="app-subheading">
            Your role is {membership.role}. Link creation requires ANALYST or
            higher.
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Recent Links</h2>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Link</th>
                <th>App</th>
                <th>Source</th>
                <th>Channel</th>
                <th>Campaign</th>
                <th>Influencer</th>
                <th>Clicks</th>
                <th>Installs</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td>{`${trackingBase}/r/${link.slug}`}</td>
                  <td>{link.app.name}</td>
                  <td>{link.source}</td>
                  <td>{link.channel}</td>
                  <td>{link.campaign}</td>
                  <td>{link.influencerId ?? "n/a"}</td>
                  <td>{link._count.clicks.toLocaleString()}</td>
                  <td>{link._count.installs.toLocaleString()}</td>
                  <td>{link.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
              {links.length === 0 ? (
                <tr>
                  <td colSpan={9}>No links yet. Create your first tracking link.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

