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

    def pgv(distance, vs):
        magnitude = cfg["source_scenario"]["magnitude_mw"]

        def rock(c):
            delta = magnitude - c["Mh"]
            fe = c["e1"] + (c["e4"] * delta + c["e5"] * delta ** 2 if delta <= 0 else c["e6"] * delta)
            radius = math.hypot(distance, c["h"])
            fp = (c["c1"] + c["c2"] * (magnitude - 4.5)) * math.log(radius) + (c["c3"] + c["Dc3"]) * (radius - 1)
            return fe + fp

        c = coefficients["pgv"]
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
    def calculate(sid, alpha=None, vs30=360, duration=None):
        sc = dict(scenarios[sid])
        if duration is not None:
            sc["duration_s"] = duration
        if alpha is None:
            alpha = 0 if sid == "A" else cfg["duration"]["alpha"]
        multiplier = (sc["duration_s"] / cfg["duration"]["reference_s"]) ** alpha
        values = {}
        for r in cells:
            if r["is_active"] != "1":
                continue
            cid = int(r["cell_id"])
            distance = float(r["rjb_s3_km" if sc["epicenter"] == "alternative" else "rjb_s1_km"])
            intensity = pgv(distance, vs30) * multiplier
            heavy = probability(intensity, "heavy")
            moderate = max(probability(intensity, "heavy_plus_moderate") - heavy, 0)
            values[cid] = dict(R_km=distance, pgv_cm_s=intensity, p_heavy=heavy,
                               p_moderate=moderate, p_slight_or_below=1-heavy-moderate, expected_deaths=0., expected_injuries=0.,
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
        assert all(0 <= v["p_heavy"] <= 1 and 0 <= v["p_moderate"] <= 1
                   and abs(v["p_heavy"] + v["p_moderate"] + v["p_slight_or_below"] - 1) < 1e-12
                   for v in values.values())
        assert all(math.isfinite(v[field]) and v[field] >= 0 for v in values.values()
                   for field in ("expected_deaths", "expected_injuries", "expected_heavily_damaged_units"))
        # Match the engine's cell-to-LGU housing-share aggregation.
        shares = defaultdict(lambda: defaultdict(float))
        for r in housing:
            shares[int(r["cell_id"])][r["adm3_pcode"]] += float(r["occupied_housing_units"])
        totals = defaultdict(lambda: defaultdict(float))
        for cid, owners in shares.items():
            denominator = sum(owners.values())
            for owner, units in owners.items():
                totals[owner]["units"] += units
                for field in ("expected_deaths", "expected_injuries", "expected_heavily_damaged_units"):
                    totals[owner][field] += values[cid][field] * units / denominator
        assert set(totals) == set(occupancy) and "PH1307606" in totals
        for owner in totals:
            assert abs(totals[owner]["units"] - occupancy[owner][0]) < .5
        for field in ("expected_deaths", "expected_injuries", "expected_heavily_damaged_units"):
            assert abs(sum(t[field] for t in totals.values()) - sum(v[field] for v in values.values())) < 1e-7
        return values, sc

    summary = {}
    primary = {}
    for sid in "ABC":
        values, sc = calculate(sid)
        primary[sid] = values
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
                            heavy_units=sum(v["expected_heavily_damaged_units"] for v in values.values()),
                            deaths=sum(v["expected_deaths"] for v in values.values()),
                            injuries=sum(v["expected_injuries"] for v in values.values()),
                            max_stored_reference_error=max_error if sid in "AB" else None)
    assert summary["A"]["horizon_s"] < summary["B"]["horizon_s"] <= summary["C"]["horizon_s"]
    assert cfg["duration"]["alpha_sensitivity"] == [0, .15, .25, .40]
    assert cfg["ground_motion"]["vs30_sensitivity_mps"] == [250, 360, 760]
    experiments = [(sid, alpha, 360) for sid in "BC" for alpha in cfg["duration"]["alpha_sensitivity"]]
    experiments += [("A", 0, vs) for vs in cfg["ground_motion"]["vs30_sensitivity_mps"]]
    calculated = {case: calculate(*case)[0] for case in experiments}
    alt_control = calculate("C", alpha=0, duration=20)[0]
    assert calculated["B", 0, 360] == primary["A"]
    assert calculated["C", 0, 360] == alt_control
    for sid in "BC":
        assert calculated[sid, .25, 360] == primary[sid]
    assert calculated["A", 0, 360] == primary["A"]
    for case in list(reversed(experiments)) + experiments[:1]:
        assert calculate(*case)[0] == calculated[case]
    assert calculate("C", alpha=0, duration=20)[0] == alt_control
    for sid in "ABC":
        assert calculate(sid)[0] == primary[sid]
    sensitivity = []
    for (sid, alpha, vs), values in calculated.items():
        sensitivity.append(dict(scenario=sid, alpha=alpha, vs30_mps=vs,
                                heavy_units=sum(v["expected_heavily_damaged_units"] for v in values.values()),
                                deaths=sum(v["expected_deaths"] for v in values.values()),
                                injuries=sum(v["expected_injuries"] for v in values.values())))
    differences = {field: summary["C"][field] - summary["B"][field] for field in ("deaths", "injuries")}
    return dict(status="PASS", scope="Python characterization using committed prepared inputs; MATLAB and video acceptance NOT RUN",
                scenarios=summary, sensitivity=sensitivity, C_minus_B=differences,
                historical_ledger_sha256=hashlib.sha256((ROOT/"results/all_checks.csv").read_bytes()).hexdigest())


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
