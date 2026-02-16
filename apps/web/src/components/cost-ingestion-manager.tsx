"use client";

import { useMemo, useState } from "react";

type AppOption = {
  id: string;
  name: string;
};

type CostRow = {
  id: string;
  date: string;
  source: string;
  channel: string;
  campaign: string | null;
  costUsd: number;
  clicks: number | null;
  impressions: number | null;
  installs: number | null;
  app: AppOption | null;
};

function isoDateToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function CostIngestionManager({
  apps,
  initialRows,
  canManage,
}: {
  apps: AppOption[];
  initialRows: CostRow[];
  canManage: boolean;
}) {
  const [rows, setRows] = useState<CostRow[]>(initialRows);
  const [appId, setAppId] = useState("");
  const [source, setSource] = useState("meta");
  const [channel, setChannel] = useState("paid_social");
  const [campaign, setCampaign] = useState("");
  const [date, setDate] = useState(isoDateToday());
  const [costUsd, setCostUsd] = useState("");
  const [syncProvider, setSyncProvider] = useState<"meta" | "tiktok">("meta");
  const [syncStartDate, setSyncStartDate] = useState(isoDateDaysAgo(7));
  const [syncEndDate, setSyncEndDate] = useState(isoDateToday());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canCreateManual = useMemo(
    () =>
      canManage &&
      source.trim().length > 0 &&
      channel.trim().length > 0 &&
      date.trim().length > 0 &&
      Number(costUsd) > 0,
    [canManage, source, channel, date, costUsd]
  );

  const refreshRows = async () => {
    const response = await fetch("/api/costs", { method: "GET" });
    const payload = (await response.json()) as {
      data?: CostRow[];
      error?: string;
    };

    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? "Unable to load cost rows.");
    }

    setRows(payload.data);
  };

  const submitManualCost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateManual) return;
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/costs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: appId || undefined,
          source,
          channel,
          campaign: campaign || undefined,
          date,
          cost_usd: Number(costUsd),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to add cost entry.");
      }

      await refreshRows();
      setCampaign("");
      setCostUsd("");
      setFeedback("Cost row added.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to add cost row."
      );
    } finally {
      setIsBusy(false);
    }
  };

  const triggerSync = async () => {
    if (!canManage) return;
    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/costs/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: syncProvider,
          app_id: appId || undefined,
          start_date: syncStartDate,
          end_date: syncEndDate,
        }),
      });
      const payload = (await response.json()) as {
        imported_count?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Cost sync failed.");
      }

      await refreshRows();
      setFeedback(
        `Imported ${payload.imported_count ?? 0} ${syncProvider} cost rows.`
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to sync provider data."
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="stack">
      <h2 style={{ margin: 0 }}>Cost Ingestion</h2>
      <p className="app-subheading">
        Add manual spend rows or pull cost from Meta/TikTok APIs using configured
        credentials.
      </p>

      <form onSubmit={submitManualCost} className="stack">
        <h3 style={{ margin: 0 }}>Manual Cost Entry</h3>
        <div className="form-grid">
          <label>
            App (optional)
            <select
              className="input"
              value={appId}
              onChange={(event) => setAppId(event.target.value)}
              disabled={!canManage}
            >
              <option value="">All apps in workspace</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Source
            <input
              className="input"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              disabled={!canManage}
              placeholder="meta"
            />
          </label>

          <label>
            Channel
            <input
              className="input"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              disabled={!canManage}
              placeholder="paid_social"
            />
          </label>

          <label>
            Campaign (optional)
            <input
              className="input"
              value={campaign}
              onChange={(event) => setCampaign(event.target.value)}
              disabled={!canManage}
              placeholder="us_q1_launch"
            />
          </label>

          <label>
            Date (YYYY-MM-DD)
            <input
              className="input"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={!canManage}
              placeholder="2026-02-16"
            />
          </label>

          <label>
            Cost USD
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={costUsd}
              onChange={(event) => setCostUsd(event.target.value)}
              disabled={!canManage}
              placeholder="125.50"
            />
          </label>
        </div>

        <div>
          <button
            className="button button-primary"
            type="submit"
            disabled={!canCreateManual || isBusy}
          >
            {isBusy ? "Saving..." : "Add Cost Row"}
          </button>
        </div>
      </form>

      <div className="stack">
        <h3 style={{ margin: 0 }}>Provider Sync</h3>
        <div className="form-grid">
          <label>
            Provider
            <select
              className="input"
              value={syncProvider}
              onChange={(event) =>
                setSyncProvider(event.target.value as "meta" | "tiktok")
              }
              disabled={!canManage}
            >
              <option value="meta">Meta Ads</option>
              <option value="tiktok">TikTok Ads</option>
            </select>
          </label>

          <label>
            Start date
            <input
              className="input"
              value={syncStartDate}
              onChange={(event) => setSyncStartDate(event.target.value)}
              disabled={!canManage}
            />
          </label>

          <label>
            End date
            <input
              className="input"
              value={syncEndDate}
              onChange={(event) => setSyncEndDate(event.target.value)}
              disabled={!canManage}
            />
          </label>
        </div>

        <div>
          <button
            type="button"
            className="button button-secondary"
            disabled={!canManage || isBusy}
            onClick={triggerSync}
          >
            {isBusy ? "Syncing..." : "Sync Provider Costs"}
          </button>
        </div>
      </div>

      {feedback ? <p style={{ color: "#0a5a43", margin: 0 }}>{feedback}</p> : null}
      {error ? <p style={{ color: "#a01f1f", margin: 0 }}>{error}</p> : null}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Channel</th>
              <th>Campaign</th>
              <th>Cost</th>
              <th>Clicks</th>
              <th>Impressions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.date).toISOString().slice(0, 10)}</td>
                <td>{row.source}</td>
                <td>{row.channel}</td>
                <td>{row.campaign ?? "n/a"}</td>
                <td>${row.costUsd.toFixed(2)}</td>
                <td>{row.clicks?.toLocaleString() ?? "n/a"}</td>
                <td>{row.impressions?.toLocaleString() ?? "n/a"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>No cost rows yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

