"use client";

import { useEffect, useState } from "react";
import SupplyGraph from "@/components/SupplyGraph";
import { fetchGraph, type GraphResponse } from "@/lib/api";

export default function Home() {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGraph()
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  const topRisks = data
    ? [...data.nodes].sort((a, b) => b.risk - a.risk).slice(0, 7)
    : [];

  return (
    <main className="layout">
      <section className="graph-pane">
        {data ? (
          <SupplyGraph data={data} />
        ) : (
          <div className="center">
            {error ? `Error: ${error}` : "Loading supply graph…"}
          </div>
        )}
      </section>

      <aside className="panel">
        <h1>CellSentry</h1>
        <p className="subtitle">Battery supply-chain risk · Week 1 vertical slice</p>

        <div className="legend">
          <span>
            <i style={{ background: "#22c55e" }} /> Low
          </span>
          <span>
            <i style={{ background: "#f59e0b" }} /> Medium
          </span>
          <span>
            <i style={{ background: "#ef4444" }} /> High
          </span>
        </div>

        <h2>Top risk nodes</h2>
        <ul className="risklist">
          {topRisks.map((n) => (
            <li key={n.id}>
              <span className={`dot ${n.risk_band}`} />
              <span className="name">{n.label}</span>
              {n.tier ? <span className="tier">T{n.tier}</span> : null}
              <span className="score">{n.risk.toFixed(0)}</span>
            </li>
          ))}
        </ul>

        {data ? (
          <p className="meta">
            {data.meta.node_count} nodes · {data.meta.edge_count} edges
          </p>
        ) : null}
      </aside>
    </main>
  );
}
