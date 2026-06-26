"""API routes."""
from fastapi import APIRouter

from ..agents.pipeline import run_scenario
from ..config import get_settings
from ..data.events import EVENTS
from ..graph.store import get_store
from ..models.schema import (
    Edge,
    Event,
    EventSource,
    GraphResponse,
    Node,
    ScenarioRequest,
    ScenarioResponse,
)
from ..risk import engine

router = APIRouter()


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "graph_backend": "neo4j" if settings.use_neo4j else "memory",
        "llm_enabled": bool(settings.anthropic_api_key),
    }


@router.get("/graph", response_model=GraphResponse)
def get_graph() -> GraphResponse:
    """Baseline supply graph with composite risk (no active events)."""
    store = get_store()
    nodes, edges = store.get_graph()
    out, _, _ = engine.compute_node_risk(nodes, edges, None)
    for n in out:
        n["baseline_risk"] = n["risk"]
    return GraphResponse(
        nodes=[Node(**n) for n in out],
        edges=[Edge(**e) for e in edges],
        meta={"node_count": len(out), "edge_count": len(edges)},
    )


@router.get("/events", response_model=list[Event])
def list_events() -> list[Event]:
    out = []
    for e in EVENTS:
        x = e["extracted"]
        out.append(
            Event(
                id=e["id"],
                date=e["date"],
                headline=e["headline"],
                body=e["body"],
                source=EventSource(**e["source"]),
                event_type=x["event_type"],
                severity=x["severity"],
                direction=x["direction"],
                materials=x["materials"],
                countries=x["countries"],
                suppliers=x["suppliers"],
            )
        )
    return out


@router.post("/scenario", response_model=ScenarioResponse)
def scenario(req: ScenarioRequest) -> ScenarioResponse:
    """Apply the given events, recompute risk + lead time, return alerts + briefs."""
    return run_scenario(req.event_ids, req.generate_briefs)


@router.post("/seed")
def seed() -> dict:
    store = get_store()
    store.load_seed()
    nodes, _ = store.get_graph()
    return {"status": "seeded", "node_count": len(nodes)}
