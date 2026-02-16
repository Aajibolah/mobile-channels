import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import {
  getWorkspaceChannelPerformance,
  getWorkspaceDashboardMetrics,
} from "@/lib/dashboard";

export default async function AppOverviewPage() {
  const { membership } = await requireActiveMembership();
  const [metricCards, channelRows] = await Promise.all([
    getWorkspaceDashboardMetrics(membership.workspaceId),
    getWorkspaceChannelPerformance(membership.workspaceId),
  ]);

  return (
    <div className="stack">
      <section className="panel">
        <h1 className="app-heading">Acquisition Overview</h1>
        <p className="app-subheading">
          Core KPIs for the last 7 days across tracked channels.
        </p>
        <div className="cards-grid" style={{ marginTop: "1rem" }}>
          {metricCards.map((metric) => (
            <article key={metric.id} className="card">
              <span className="metric-label">{metric.label}</span>
              <span className="metric-value">{metric.value}</span>
              <span className="metric-trend">{metric.trend}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.8rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Channel Performance</h2>
            <p className="app-subheading">
              Last 30-day install, signup, and revenue performance by source.
            </p>
          </div>
          <Link className="button button-secondary" href="/app/links">
            Manage Links
          </Link>
        </div>

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
                  <td colSpan={8}>No attributed install data yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
