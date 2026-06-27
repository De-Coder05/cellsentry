"""Statistical process control over incoming cell-inspection lots.

Per supplier: build a baseline from the first N lots (assumed in-control),
derive 3-sigma control limits, and flag lots that breach them or whose EWMA
trend drifts. Detector reads observed measurements only.
"""
from __future__ import annotations

BASELINE_N = 15
K_SIGMA = 3.5
EWMA_LAMBDA = 0.3
EWMA_K = 2.5


def _mean_std(xs: list[float]) -> tuple[float, float]:
    n = len(xs)
    m = sum(xs) / n
    var = sum((x - m) ** 2 for x in xs) / max(n - 1, 1)
    return m, var ** 0.5


def flag_lots(lots: list[dict]) -> list[dict]:
    by_sup: dict[str, list[dict]] = {}
    for l in lots:
        by_sup.setdefault(l["supplier_id"], []).append(l)

    out: list[dict] = []
    for group in by_sup.values():
        group = sorted(group, key=lambda x: x["day"])
        base = group[:BASELINE_N]
        cm, cs = _mean_std([b["capacity_mah"] for b in base])
        im, isd = _mean_std([b["ir_mohm"] for b in base])
        lcl_cap = cm - K_SIGMA * cs
        ucl_ir = im + K_SIGMA * isd

        ew_cap, ew_ir = cm, im
        for l in group:
            ew_cap = EWMA_LAMBDA * l["capacity_mah"] + (1 - EWMA_LAMBDA) * ew_cap
            ew_ir = EWMA_LAMBDA * l["ir_mohm"] + (1 - EWMA_LAMBDA) * ew_ir
            reasons = []
            if l["capacity_mah"] < lcl_cap:
                reasons.append("capacity below control limit")
            if l["ir_mohm"] > ucl_ir:
                reasons.append("internal resistance above control limit")
            if ew_cap < cm - EWMA_K * cs:
                reasons.append("EWMA capacity drift")
            if ew_ir > im + EWMA_K * isd:
                reasons.append("EWMA resistance drift")
            out.append({**l, "flagged": len(reasons) > 0, "reasons": reasons})
    return out


def supplier_status(flagged_lots: list[dict]) -> list[dict]:
    by: dict[str, list[dict]] = {}
    for l in flagged_lots:
        by.setdefault(l["supplier_id"], []).append(l)
    res = []
    for group in by.values():
        group = sorted(group, key=lambda x: x["day"])
        last5 = group[-5:]
        drifting = sum(1 for l in last5 if l["flagged"]) >= 3
        res.append(
            {
                "supplier_id": group[0]["supplier_id"],
                "supplier": group[0]["supplier"],
                "status": "drifting" if drifting else "stable",
                "flagged_count": sum(1 for l in group if l["flagged"]),
                "total": len(group),
            }
        )
    return res
