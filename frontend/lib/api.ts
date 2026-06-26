export type RiskBand = "low" | "medium" | "high";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  tier?: number | null;
  country?: string | null;
  country_shares?: Record<string, number> | null;
  risk: number;
  risk_band: RiskBand;
  risk_breakdown: Record<string, number>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: Record<string, number>;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

export async function fetchGraph(): Promise<GraphResponse> {
  const res = await fetch(`${API_BASE}/graph`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch graph (${res.status})`);
  }
  return res.json();
}
