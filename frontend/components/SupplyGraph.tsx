"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { GraphResponse } from "@/lib/api";

// react-force-graph touches `window` at import time -> load client-side only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const BAND_COLOR: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

const TYPE_SIZE: Record<string, number> = {
  product: 11,
  pack: 9,
  cell: 8,
  material: 6,
  raw_material: 6,
  supplier: 5,
  country: 4,
};

export default function SupplyGraph({ data }: { data: GraphResponse }) {
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.edges.map((e) => ({ ...e })),
    }),
    [data],
  );

  return (
    <ForceGraph2D
      graphData={graphData}
      nodeId="id"
      linkSource="source"
      linkTarget="target"
      backgroundColor="#0b1020"
      linkColor={() => "rgba(148,163,184,0.30)"}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      cooldownTicks={120}
      nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const r = TYPE_SIZE[node.type] ?? 5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = BAND_COLOR[node.risk_band] ?? "#64748b";
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = "rgba(2,6,23,0.7)";
        ctx.stroke();

        const fontSize = Math.max(11 / globalScale, 2.5);
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(node.label, node.x, node.y + r + 1);
      }}
      nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
        const r = TYPE_SIZE[node.type] ?? 5;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
        ctx.fill();
      }}
    />
  );
}
