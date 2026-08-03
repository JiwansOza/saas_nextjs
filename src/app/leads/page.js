"use client";

/**
 * Leads received from Preta.
 *
 * Preta does not store lead data — it delivers each submission to this app's own backend, which
 * writes it to MongoDB. This page reads them back, so it doubles as an end-to-end check that a
 * form element actually lands somewhere.
 *
 * Reads from the backend directly (same place the login and signup pages go) rather than through
 * a Next.js route, so there is exactly one copy of the leads and one place they live.
 */

import { useCallback, useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

function RouteBadge({ route, verification }) {
  const isPreta = route === "through-preta";
  const label = isPreta ? "Through Preta" : "Direct";

  // Only a signed request can be verified, so this reads as a warning solely on the Preta path.
  const suspicious = isPreta && verification !== "verified";

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          isPreta
            ? "bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20"
            : "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
        }`}
      >
        {label}
      </span>
      {suspicious && (
        <span className="text-xs text-amber-500">
          {verification === "no-secret-configured" ? "unsigned — no secret set" : verification}
        </span>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [secretConfigured, setSecretConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/leads`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setSecretConfigured(!!data.signingSecretConfigured);
      setError("");
    } catch (e) {
      // The backend runs on Render's free tier, which sleeps when idle — the first request
      // after a lull can take ~30s or time out. Say so rather than showing a bare error.
      setError(
        `${e.message || "Could not load leads"} — the backend may be waking up, try again in a moment.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll so a submission made in another tab shows up without a manual refresh.
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // Form fields vary per element, so build the columns from whatever actually arrived.
  const fieldKeys = [
    ...new Set(leads.flatMap((l) => Object.keys(l.formData || {}))),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Form submissions delivered here by Preta. Preta itself does not store this data.
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 text-xs">
        <span
          className={`rounded-md px-3 py-1.5 ring-1 ${
            secretConfigured
              ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
              : "bg-muted text-muted-foreground ring-border"
          }`}
        >
          {secretConfigured
            ? "Signature verification on"
            : "PRETA_SIGNING_SECRET not set — signatures not checked"}
        </span>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500 ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-muted-foreground">Loading…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <p className="font-medium">No leads yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Submit a form on this site and it will appear here within a few seconds. If nothing
            arrives, check that the delivery endpoint in Preta points at{" "}
            <code className="rounded bg-muted px-1 py-0.5">{BACKEND_URL}/leads</code>.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Received</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Route</th>
                {fieldKeys.map((k) => (
                  <th key={k} className="whitespace-nowrap px-4 py-3 font-medium">
                    {k}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 font-medium">Page</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatTime(lead.receivedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <RouteBadge route={lead.route} verification={lead.verification} />
                  </td>
                  {fieldKeys.map((k) => (
                    <td key={k} className="px-4 py-3">
                      {lead.formData?.[k] || <span className="text-muted-foreground">—</span>}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {lead.pathname || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {leads.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {leads.length} lead{leads.length === 1 ? "" : "s"} · refreshes every 5s
        </p>
      )}
    </div>
  );
}
