"use client";

import { useMemo, useState } from "react";
import type { IngestionScope } from "@/lib/ingestion-keys";

type AppOption = {
  id: string;
  name: string;
};

type KeyRow = {
  id: string;
  name: string;
  appId: string | null;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  app: AppOption | null;
};

const availableScopes: IngestionScope[] = [
  "mobile:install:write",
  "mobile:event:write",
  "mobile:skan:write",
  "cost:write",
];

function scopeLabel(scope: IngestionScope): string {
  switch (scope) {
    case "mobile:install:write":
      return "Install ingestion";
    case "mobile:event:write":
      return "Event ingestion";
    case "mobile:skan:write":
      return "SKAN ingestion";
    case "cost:write":
      return "Cost ingestion";
  }
}

export function IngestionKeyManager({
  apps,
  initialKeys,
  canManage,
}: {
  apps: AppOption[];
  initialKeys: KeyRow[];
  canManage: boolean;
}) {
  const [keys, setKeys] = useState<KeyRow[]>(initialKeys);
  const [name, setName] = useState("");
  const [appId, setAppId] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<IngestionScope[]>([
    "mobile:install:write",
    "mobile:event:write",
  ]);
  const [lastIssuedKey, setLastIssuedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => canManage && name.trim().length > 0 && selectedScopes.length > 0,
    [canManage, name, selectedScopes.length]
  );

  const refreshKeys = async () => {
    const response = await fetch("/api/ingestion-keys", { method: "GET" });
    const payload = (await response.json()) as {
      data?: KeyRow[];
      error?: string;
    };
    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? "Unable to load keys.");
    }
    setKeys(payload.data);
  };

  const toggleScope = (scope: IngestionScope) => {
    setSelectedScopes((previous) =>
      previous.includes(scope)
        ? previous.filter((item) => item !== scope)
        : [...previous, scope]
    );
  };

  const createKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/ingestion-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          app_id: appId || undefined,
          scopes: selectedScopes,
        }),
      });
      const payload = (await response.json()) as {
        data?: KeyRow & { key_plaintext?: string };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to create ingestion key.");
      }

      setLastIssuedKey(payload.data.key_plaintext ?? null);
      setName("");
      setAppId("");
      await refreshKeys();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create key."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/ingestion-keys/${keyId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to revoke key.");
      }
      await refreshKeys();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to revoke key."
      );
    }
  };

  return (
    <div className="stack">
      <h2 style={{ margin: 0 }}>Ingestion API Keys</h2>
      <p className="app-subheading">
        Use these keys in `x-st-api-key` for mobile install/event/SKAN ingestion.
      </p>

      {lastIssuedKey ? (
        <div className="panel">
          <strong>Copy this key now (shown once)</strong>
          <p style={{ margin: "0.45rem 0 0", color: "var(--muted)" }}>
            <code>{lastIssuedKey}</code>
          </p>
        </div>
      ) : null}

      <form className="stack" onSubmit={createKey}>
        <div className="form-grid">
          <label>
            Key name
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!canManage}
              placeholder="Android ingestion key"
            />
          </label>

          <label>
            Restrict to app (optional)
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
        </div>

        <div className="pill-row">
          {availableScopes.map((scope) => (
            <label key={scope} className="badge" style={{ gap: "0.4rem" }}>
              <input
                type="checkbox"
                checked={selectedScopes.includes(scope)}
                onChange={() => toggleScope(scope)}
                disabled={!canManage}
              />
              {scopeLabel(scope)}
            </label>
          ))}
        </div>

        <div>
          <button
            className="button button-primary"
            type="submit"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create API Key"}
          </button>
        </div>
      </form>

      {error ? <p style={{ color: "#a01f1f", margin: 0 }}>{error}</p> : null}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Prefix</th>
              <th>App</th>
              <th>Scopes</th>
              <th>Status</th>
              <th>Last used</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>{key.keyPrefix}</td>
                <td>{key.app?.name ?? "All apps"}</td>
                <td>{key.scopes.join(", ")}</td>
                <td>{key.isActive ? "Active" : "Revoked"}</td>
                <td>
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toISOString().slice(0, 19).replace("T", " ")
                    : "never"}
                </td>
                <td>{new Date(key.createdAt).toISOString().slice(0, 10)}</td>
                <td>
                  {key.isActive && canManage ? (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => revokeKey(key.id)}
                    >
                      Revoke
                    </button>
                  ) : (
                    "n/a"
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 ? (
              <tr>
                <td colSpan={8}>No API keys yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

