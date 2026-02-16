import { requireActiveMembership } from "@/lib/auth/session";
import {
  getWorkspaceChannelPerformance,
  getWorkspaceDashboardMetrics,
} from "@/lib/dashboard";

const events = [
  "install",
  "signup",
  "trial_start",
  "purchase",
  "subscription_start",
  "subscription_renewal",
];

export default async function DashboardPage() {
  const { membership } = await requireActiveMembership();
  const [metrics, channelRows] = await Promise.all([
    getWorkspaceDashboardMetrics(membership.workspaceId),
    getWorkspaceChannelPerformance(membership.workspaceId),
  ]);

  return (
    <div className="stack">
      <section className="panel">
        <h1 className="app-heading">Dashboard</h1>
        <p className="app-subheading">
          Query-backed reporting from tracked installs and events in your
          workspace.
        </p>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>KPI Snapshot (Last 7 Days)</h2>
        <div className="cards-grid">
          {metrics.map((metric) => (
            <article key={metric.id} className="card">
              <span className="metric-label">{metric.label}</span>
              <span className="metric-value">{metric.value}</span>
              <span className="metric-trend">{metric.trend}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Tracked Events</h2>
        <p className="app-subheading">
          Workspace event taxonomy configured for attribution and revenue
          reporting.
        </p>
        <div className="pill-row">
          {events.map((eventName) => (
            <span key={eventName} className="pill">
              {eventName}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Channel Breakdown (Last 30 Days)</h2>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Channel</th>
                <th>Installs</th>
                <th>Signups</th>
                <th>Revenue</th>
                <th>Spend</th>
                <th>CAC</th>
                <th>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {channelRows.map((row) => (
                <tr key={`${row.source}-${row.channel}`}>
                  <td>{row.source}</td>
                  <td>{row.channel}</td>
                  <td>{row.installs.toLocaleString()}</td>
                  <td>{row.signups.toLocaleString()}</td>
                  <td>${row.revenueUsd.toLocaleString()}</td>
                  <td>{row.spendUsd ? `$${row.spendUsd.toFixed(2)}` : "$0.00"}</td>
                  <td>{row.cacUsd ? `$${row.cacUsd.toFixed(2)}` : "n/a"}</td>
                  <td>{row.roas}</td>
                </tr>
              ))}
              {channelRows.length === 0 ? (
                <tr>
                  <td colSpan={8}>No channel data yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
