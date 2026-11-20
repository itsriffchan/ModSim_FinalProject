"""Independent characterization of committed inputs; not MATLAB execution.

Uses only Python's standard library. Does not write scientific deliverables.
"""
import csv
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def rows(path):
    with (ROOT / path).open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(line for line in f if not line.startswith("#")))


def run():
    cfg = json.loads((ROOT / "config/modsim_config.json").read_text())
    scenarios = {s["id"]: s for s in cfg["scenarios"]}
    assert set(scenarios) == {"A", "B", "C"}
    assert [(scenarios[i]["epicenter"], scenarios[i]["duration_s"]) for i in "ABC"] == [
        ("baseline", 20), ("baseline", 40), ("alternative", 40)]
    assert all(s["distance_model"] == "finite_rupture" for s in scenarios.values())
    assert cfg["duration"]["reference_s"] == 20 and cfg["duration"]["alpha"] == .25
    coefficients = {r["imt"]: {k: float(v) for k, v in r.items() if k not in ("imt", "source")}
                    for r in rows("data/processed/bssa14_coefficients.csv")}

    def pgv(distance):
        magnitude = cfg["source_scenario"]["magnitude_mw"]

        def rock(c):
            delta = magnitude - c["Mh"]
            fe = c["e1"] + (c["e4"] * delta + c["e5"] * delta ** 2 if delta <= 0 else c["e6"] * delta)
            radius = math.hypot(distance, c["h"])
            fp = (c["c1"] + c["c2"] * (magnitude - 4.5)) * math.log(radius) + (c["c3"] + c["Dc3"]) * (radius - 1)
            return fe + fp

        c = coefficients["pgv"]
        vs = cfg["ground_motion"]["vs30_mps"]
        f2 = c["f4"] * (math.exp(c["f5"] * (min(vs, 760) - 360)) - math.exp(c["f5"] * 400))
        return math.exp(rock(c) + c["c"] * math.log(min(vs, c["Vc"]) / 760)
                        + f2 * math.log((math.exp(rock(coefficients["pga"])) + .1) / .1))

    frag = {r["damage_threshold"]: r for r in rows("data/processed/fragility_parameters.csv")
            if r["structure_type"] == "RC" and r["construction_period"] == "average"}

    def probability(value, threshold):
        r = frag[threshold]
        return .5 * math.erfc(-(math.log(value) - float(r["lambda"])) / (float(r["zeta"]) * math.sqrt(2)))

    occupancy = defaultdict(lambda: [0., 0.])
    for r in rows("data/processed/ncr_lgu_housing_type_2020.csv"):
        v = occupancy[r["adm3_pcode"]]
        v[0] += float(r["occupied_housing_units"])
        v[1] += float(r["household_population"])
    rates = {(r["hazus_sbt"], r["damage_state"]): [float(r[f"severity{i}_pct"]) / 100 for i in range(1, 5)]
             for r in rows("data/processed/hazus61_indoor_casualty_rates.csv")}
    collapse = {r["hazus_sbt"]: float(r["collapse_given_complete"]) for r in rows("data/processed/hazus61_collapse_rates.csv")}
    cells = rows("results/ncr_grid/ncr_grid_cells.csv")
    housing = rows("results/ncr_grid/ncr_cell_lgu_housing.csv")
    arrivals = {(r["epicenter_id"], int(r["cell_id"])): float(r["s_arrival_s"])
                for r in rows("results/ncr_grid/ncr_wave_arrivals.csv")}
    assert abs(sum(float(r["population_2020"]) for r in cells) - 13484462) < .5
    assert abs(sum(float(r["occupied_housing_units"]) for r in housing) - 3257020) < .5
    assert len(occupancy) == 17 and "PH1307606" in occupancy
    summary = {}
    for sid in "ABC":
        sc = scenarios[sid]
        multiplier = (sc["duration_s"] / cfg["duration"]["reference_s"]) ** (0 if sid == "A" else cfg["duration"]["alpha"])
        values = {}
        for r in cells:
            if r["is_active"] != "1":
                continue
            cid = int(r["cell_id"])
            distance = float(r["rjb_s3_km" if sid == "C" else "rjb_s1_km"])
            intensity = pgv(distance) * multiplier
            heavy = probability(intensity, "heavy")
            moderate = max(probability(intensity, "heavy_plus_moderate") - heavy, 0)
            values[cid] = dict(R_km=distance, pgv_cm_s=intensity, p_heavy=heavy,
                               p_moderate=moderate, expected_deaths=0., expected_injuries=0.,
                               expected_heavily_damaged_units=0.)
        for r in housing:
            v = values[int(r["cell_id"])]; sbt = r["hazus_sbt"]
            units = float(r["occupied_housing_units"])
            ou, pop = occupancy[r["adm3_pcode"]]
            occupants = units * pop / ou * cfg["casualty"]["indoor_fraction"]
            pm, ph = v["p_moderate"], v["p_heavy"]
            cr = collapse[sbt]
            fm, fn, fc = [rates[sbt, state] for state in ("moderate", "complete_no_collapse", "complete_collapse")]
            v["expected_deaths"] += occupants * (pm * fm[3] + ph * (1-cr) * fn[3] + ph * cr * fc[3])
            v["expected_injuries"] += occupants * (pm * sum(fm[:3]) + ph * (1-cr) * sum(fn[:3]) + ph * cr * sum(fc[:3]))
            v["expected_heavily_damaged_units"] += units * ph
        max_error = 0.
        if sid in "AB":
            ref = "S1_baseline_20s" if sid == "A" else "S2_baseline_40s"
            for r in rows(f"results/scenarios/{ref}_cells.csv"):
                if int(r["cell_id"]) not in values:
                    continue
                for field, actual in values[int(r["cell_id"])].items():
                    expected = float(r[field]); error = abs(actual - expected)
                    assert error <= 1e-8 + 1e-12 * abs(expected), (sid, field, error)
                    max_error = max(max_error, error)
        horizon = math.ceil(max(arrivals[sc["epicenter"], cid] + sc["duration_s"] for cid in values))
        # Per-cell direct progression: pre-onset zero, terminal exact, stable hold.
        for cid in values:
            onset = arrivals[sc["epicenter"], cid]
            f = lambda t: min(max((t - onset) / sc["duration_s"], 0), 1)
            assert f(0) == f(onset) == 0 and f(horizon) == f(horizon + 5) == 1
        summary[sid] = dict(active_cells=len(values), horizon_s=horizon,
                            deaths=sum(v["expected_deaths"] for v in values.values()),
                            injuries=sum(v["expected_injuries"] for v in values.values()),
                            max_stored_reference_error=max_error if sid in "AB" else None)
    assert summary["A"]["horizon_s"] < summary["B"]["horizon_s"] <= summary["C"]["horizon_s"]
    return dict(status="PASS", scope="Python characterization using committed prepared inputs; MATLAB and video acceptance NOT RUN",
                scenarios=summary,
                historical_ledger_sha256=hashlib.sha256((ROOT/"results/all_checks.csv").read_bytes()).hexdigest())


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
