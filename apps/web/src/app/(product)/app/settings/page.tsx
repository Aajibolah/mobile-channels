import { CostIngestionManager } from "@/components/cost-ingestion-manager";
import { IngestionKeyManager } from "@/components/ingestion-key-manager";
import { hasRequiredRole } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { listWorkspaceCostEntries } from "@/lib/costs";
import { listWorkspaceIngestionApiKeys } from "@/lib/ingestion-keys";
import { getWorkspaceApps } from "@/lib/links";

export default async function SettingsPage() {
  const { membership } = await requireActiveMembership();
  const [apps, keys, costEntries] = await Promise.all([
    getWorkspaceApps(membership.workspaceId),
    listWorkspaceIngestionApiKeys(membership.workspaceId),
    listWorkspaceCostEntries(membership.workspaceId),
  ]);

  const canManageKeys = hasRequiredRole(membership.role, "ADMIN");
  const canManageCosts = hasRequiredRole(membership.role, "ANALYST");

  return (
    <div className="stack">
      <section className="panel">
        <h1 className="app-heading">Settings</h1>
        <p className="app-subheading">
          Configure ingestion security, attribution defaults, and spend data
          sources for true CAC/ROAS reporting.
        </p>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Attribution Defaults</h2>
        <div className="form-grid">
          <label>
            Attribution model
            <input className="input" value="Last click" readOnly />
          </label>
          <label>
            Click window
            <input className="input" value="7 days" readOnly />
          </label>
          <label>
            Organic fallback
            <input className="input" value="organic/unattributed" readOnly />
          </label>
          <label>
            Workspace timezone
            <input className="input" value="UTC" readOnly />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Role Model</h2>
        <p className="app-subheading">
          Owner, Admin, Analyst, Viewer role tiers are enforced for settings,
          key management, and cost ingestion.
        </p>
        <div className="pill-row">
          <span className="pill">Owner</span>
          <span className="pill">Admin</span>
          <span className="pill">Analyst</span>
          <span className="pill">Viewer</span>
        </div>
      </section>

      <section className="panel">
        <IngestionKeyManager
          apps={apps}
          initialKeys={keys.map((key) => ({
            ...key,
            appId: key.appId,
            createdAt: key.createdAt.toISOString(),
            lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
            revokedAt: key.revokedAt?.toISOString() ?? null,
          }))}
          canManage={canManageKeys}
        />
      </section>

      <section className="panel">
        <CostIngestionManager
          apps={apps}
          initialRows={costEntries.map((row) => ({
            id: row.id,
            date: row.date.toISOString(),
            source: row.source,
            channel: row.channel,
            campaign: row.campaign,
            costUsd: row.costUsd,
            clicks: row.clicks,
            impressions: row.impressions,
            installs: row.installs,
            app: row.app,
          }))}
          canManage={canManageCosts}
        />
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Mobile Ingestion Endpoints</h2>
        <ul className="feature-list">
          <li>
            <code>POST /api/mobile/install</code> with <code>x-st-api-key</code>{" "}
            and app/store identifiers.
          </li>
          <li>
            <code>POST /api/events</code> with <code>x-st-api-key</code> for
            signup and revenue events.
          </li>
          <li>
            <code>POST /api/mobile/skan</code> with <code>x-st-api-key</code>{" "}
            for iOS SKAdNetwork postbacks.
          </li>
          <li>
            <code>POST /api/costs/sync</code> for Meta/TikTok ad spend imports.
          </li>
        </ul>
      </section>
    </div>
  );
}
