"use client";

/**
 * Leads received from Preta.
 *
 * Preta runs this site's forms in `direct` mode: the visitor's browser posts the payload straight
 * to our own backend, which writes it to MongoDB. Preta keeps only metadata. This page reads the
 * leads back, so it doubles as an end-to-end check that a form element actually lands somewhere.
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

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/leads`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data.leads || []);
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
  const fieldKeys = [...new Set(leads.flatMap((l) => Object.keys(l.formData || {})))];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Form submissions delivered straight to this site’s backend. Preta never receives this data.
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Refresh
        </button>
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
            <code className="rounded bg-muted px-1 py-0.5">{BACKEND_URL}/leads</code>, and that the
            backend allows CORS from this site — without it the browser cannot deliver, and in
            direct mode there is no retry.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Received</th>
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
