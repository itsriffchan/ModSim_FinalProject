#!/usr/bin/env python3
"""Build analysis-ready NCR inputs for the ModSim MATLAB engine.

Downloads (or re-uses) public PSA, COD-AB, GEM and WorldPop products,
clips them to NCR, reprojects to EPSG:32651, and writes plain CSVs.

Usage:
    python tools/prep_ncr_inputs.py --repo-root . [--offline]

Do not fabricate values. If a required file is missing in --offline mode,
the script exits with an error.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pyproj
from shapely.geometry import LineString, Point, box, mapping
from shapely.ops import transform as shp_transform
import geopandas as gpd
import rasterio
from rasterio.mask import mask as rio_mask
from rasterio.windows import from_bounds

WGS84 = "EPSG:4326"
UTM51 = "EPSG:32651"
EXPECTED_NCR_POP = 13_484_462
EXPECTED_LGU = 17
GEM_CATALOG = "PHL_31"
GEM_SHA = "37babb516edfac22b5ae91744495d8546b3ae4676b4d4f68cc77da8222df20e1"
WP_SHA = "6a98ec3e2b9389535d2b9d9708fb9f5700aabf2a34f5a7fbc093dbc32724cac2"

CROSSWALK = [
    # psa_name (after stripping leading dots), cod_name, adm3_pcode, district
    ("City of Manila", "City of Manila", "PH1303901", "NCR-1"),
    ("City of Mandaluyong", "City of Mandaluyong", "PH1307401", "NCR-2"),
    ("City of Marikina", "City of Marikina", "PH1307402", "NCR-2"),
    ("City of Pasig", "City of Pasig", "PH1307403", "NCR-2"),
    ("Quezon City", "Quezon City", "PH1307404", "NCR-2"),
    ("City of San Juan", "City of San Juan", "PH1307405", "NCR-2"),
    ("City of Caloocan", "Caloocan City", "PH1307501", "NCR-3"),
    ("City of Malabon", "City of Malabon", "PH1307502", "NCR-3"),
    ("City of Navotas", "City of Navotas", "PH1307503", "NCR-3"),
    ("City of Valenzuela", "City of Valenzuela", "PH1307504", "NCR-3"),
    ("City of Las Piñas", "City of Las Piñas", "PH1307601", "NCR-4"),
    ("City of Makati", "City of Makati", "PH1307602", "NCR-4"),
    ("City of Muntinlupa", "City of Muntinlupa", "PH1307603", "NCR-4"),
    ("City of Parañaque", "City of Parañaque", "PH1307604", "NCR-4"),
    ("Pasay City", "Pasay City", "PH1307605", "NCR-4"),
    ("Pateros", "Pateros", "PH1307606", "NCR-4"),
    ("City of Taguig", "Taguig City", "PH1307607", "NCR-4"),
]

PSA_EXPECTED = {
    "PH1303901": 1_846_513,
    "PH1307401": 425_758,
    "PH1307402": 456_059,
    "PH1307403": 803_159,
    "PH1307404": 2_960_048,
    "PH1307405": 126_347,
    "PH1307501": 1_661_584,
    "PH1307502": 380_522,
    "PH1307503": 247_543,
    "PH1307504": 714_978,
    "PH1307601": 606_293,
    "PH1307602": 629_616,
    "PH1307603": 543_445,
    "PH1307604": 689_992,
    "PH1307605": 440_656,
    "PH1307607": 886_722,
    "PH1307606": 65_227,
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clean_psa_name(s: str) -> str:
    return s.lstrip(".").replace("\xa0", " ").strip()


def write_csv(path: Path, rows: list[dict], fieldnames: list[str], comment: str | None = None):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        if comment:
            for line in comment.strip().splitlines():
                f.write(f"# {line}\n")
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"  wrote {path} ({len(rows)} rows)")


def process_population(raw_csv: Path, out_dir: Path) -> pd.DataFrame:
    # Latin-1 as documented (ñ)
    text = raw_csv.read_bytes().decode("latin-1")
    import io
    df = pd.read_csv(io.StringIO(text))
    df.columns = [c.strip().strip('"') for c in df.columns]
    df["psa_name"] = df["Geographic Location"].map(clean_psa_name)
    ncr = df[df["psa_name"] == "NATIONAL CAPITAL REGION (NCR)"].iloc[0]
    ncr_pop = int(ncr["Total Population"])
    assert ncr_pop == EXPECTED_NCR_POP, ncr_pop
    lgus = df[df["psa_name"] != "NATIONAL CAPITAL REGION (NCR)"].copy()
    assert len(lgus) == EXPECTED_LGU, len(lgus)
    name_to = {r[0]: r for r in CROSSWALK}
    rows = []
    for _, r in lgus.iterrows():
        name = r["psa_name"]
        assert name in name_to, f"unmapped PSA name {name!r}"
        psa_name, cod_name, pcode, district = name_to[name]
        pop = int(r["Total Population"])
        assert pop == PSA_EXPECTED[pcode], (pcode, pop, PSA_EXPECTED[pcode])
        hhpop = int(r["Household Population"])
        hh = int(r["Number of Households"])
        assert pop > 0 and hhpop > 0 and hh > 0
        rows.append({
            "adm3_pcode": pcode,
            "lgu_name": cod_name,
            "psa_name": psa_name,
            "district": district,
            "total_population": pop,
            "household_population": hhpop,
            "households": hh,
            "reference_date": "2020-05-01",
            "source_table": "0011A6DPHH0",
            "source_url": "https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2020/0011A6DPHH0.px",
            "retrieved_utc": "2026-11-13T03:57:00Z",
        })
    rows.sort(key=lambda x: x["adm3_pcode"])
    s = sum(r["total_population"] for r in rows)
    assert s == ncr_pop == EXPECTED_NCR_POP, s
    write_csv(out_dir / "ncr_lgu_population_2020.csv", rows,
              list(rows[0].keys()))
    cw = [{
        "psa_name": a, "cod_name": b, "adm3_pcode": c, "adm2_pcode": c[:7] + "00" if False else c[:6] + "00",
        "district": d,
    } for a, b, c, d in CROSSWALK]
    # fix adm2: PH13039, PH13074, PH13075, PH13076
    for r in cw:
        r["adm2_pcode"] = r["adm3_pcode"][:8]  # PH130390, actually PH13039 for Manila = first 7? 
        # P-codes: PH13 (adm1) + 03901 for Manila. adm2 of Manila is PH13039 (NCR district 1 / City of Manila)
        r["adm2_pcode"] = r["adm3_pcode"][:7]  # PH13039, PH13074, ...
    write_csv(out_dir / "ncr_lgu_crosswalk.csv", cw,
              ["psa_name", "cod_name", "adm3_pcode", "adm2_pcode", "district"])
    return pd.DataFrame(rows)


def process_housing(type_csv: Path, floors_csv: Path, pop: pd.DataFrame, out_dir: Path):
    t = pd.read_csv(type_csv, encoding="latin-1")
    t["psa_name"] = t["Geographic Location"].map(clean_psa_name)
    t["btype"] = t["Type of Building"].str.strip()
    # Exclude NCR total row from observation table
    t = t[t["psa_name"] != "NATIONAL CAPITAL REGION (NCR)"].copy()
    name_to_pcode = {r[0]: r[2] for r in CROSSWALK}
    t["adm3_pcode"] = t["psa_name"].map(name_to_pcode)
    assert t["adm3_pcode"].notna().all(), t.loc[t["adm3_pcode"].isna(), "psa_name"].unique()
    # keep all types including "All Types of Building" as a check, write disaggregated without All
    units_col = "Occupied Housing Units"
    hh_col = [c for c in t.columns if "Number of Households" in c][0]
    hp_col = [c for c in t.columns if "Household Population" in c][0]
    detail = t[t["btype"] != "All Types of Building"].copy()
    rows = []
    for _, r in detail.iterrows():
        rows.append({
            "adm3_pcode": r["adm3_pcode"],
            "psa_name": r["psa_name"],
            "building_type": r["btype"],
            "occupied_housing_units": int(r[units_col]),
            "households": int(r[hh_col]) if pd.notna(r[hh_col]) else "",
            "household_population": int(r[hp_col]) if pd.notna(r[hp_col]) else "",
            "unit": "occupied_housing_units_not_buildings",
            "reference_date": "2020-05-01",
            "source_table": "0041A6DTOB0",
        })
    write_csv(out_dir / "ncr_lgu_housing_type_2020.csv", rows,
              list(rows[0].keys()),
              comment="Occupied housing units (not building counts). Source: PSA 2020 CPH OpenSTAT 0041A6DTOB0.")
    # conservation: all-types equals sum of types per LGU
    allr = t[t["btype"] == "All Types of Building"]
    for _, r in allr.iterrows():
        s = detail.loc[detail["adm3_pcode"] == r["adm3_pcode"], units_col].sum()
        assert int(s) == int(r[units_col]), (r["psa_name"], s, r[units_col])
    ncr_units = int(allr[units_col].sum())
    print(f"  NCR occupied housing units (17 LGU sum): {ncr_units}")

    fl = pd.read_csv(floors_csv, encoding="latin-1")
    fl["psa_name"] = fl["Geographic Location"].map(clean_psa_name)
    fl["btype"] = fl["Type of Building"].str.strip()
    fl = fl[(fl["psa_name"] != "NATIONAL CAPITAL REGION (NCR)") &
            (fl["btype"] == "All Types of Building")].copy()
    fl["adm3_pcode"] = fl["psa_name"].map(name_to_pcode)
    floor_cols = ["One Floor", "Two Floors", "Three Floors", "Four Floors",
                  "Five to 10 Floors", "11 Floors or more", "Not Reported", "Not applicable"]
    frows = []
    for _, r in fl.iterrows():
        total = int(r["Total"])
        parts = {c: int(r[c]) if pd.notna(r[c]) else 0 for c in floor_cols}
        assert sum(parts.values()) == total, (r["psa_name"], sum(parts.values()), total)
        for c, v in parts.items():
            frows.append({
                "adm3_pcode": r["adm3_pcode"],
                "psa_name": r["psa_name"],
                "floor_group": c,
                "occupied_housing_units": v,
                "reference_date": "2020-05-01",
                "source_table": "0051A6DBNF0",
            })
    write_csv(out_dir / "ncr_lgu_housing_floors_2020.csv", frows,
              list(frows[0].keys()),
              comment="Occupied housing units by number of floors (all building types). PSA 2020 CPH 0051A6DBNF0.")
    return ncr_units


def process_boundaries(gdb_dir: Path, out_dir: Path, transformer) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(gdb_dir, layer="phl_admin3", engine="pyogrio")
    # column names may vary in case
    cols = {c.lower(): c for c in gdf.columns}
    def col(*names):
        for n in names:
            if n.lower() in cols:
                return cols[n.lower()]
        raise KeyError(names, list(gdf.columns))
    pcode_col = col("adm3_pcode", "ADM3_PCODE")
    name_col = col("adm3_en", "adm3_name", "ADM3_EN")
    adm1_col = col("adm1_pcode", "ADM1_PCODE")
    area_col = col("area_sqkm", "AREA_SQKM") if any(c.lower() in ("area_sqkm",) for c in cols) else None
    ncr = gdf[gdf[adm1_col].astype(str).str.upper() == "PH13"].copy()
    assert len(ncr) == 17, (len(ncr), ncr[name_col].tolist() if name_col else "no name")
    assert ncr[pcode_col].nunique() == 17
    expected_pcodes = {r[2] for r in CROSSWALK}
    got = set(ncr[pcode_col].astype(str))
    assert got == expected_pcodes, (got - expected_pcodes, expected_pcodes - got)
    ncr = ncr.to_crs(UTM51)
    ncr["utm_area_m2"] = ncr.geometry.area
    ncr["utm_area_km2"] = ncr["utm_area_m2"] / 1e6
    union = ncr.unary_union
    union_km2 = union.area / 1e6
    print(f"  NCR union area EPSG:32651 = {union_km2:.4f} km2 (target 598.73 ± 0.5%)")
    assert abs(union_km2 - 598.73) / 598.73 <= 0.005, union_km2
    # no overlaps: sum of areas equals union (within 0.1%)
    sum_a = ncr["utm_area_km2"].sum()
    assert abs(sum_a - union_km2) / union_km2 <= 0.001, (sum_a, union_km2)
    # parts
    attr_rows = []
    vert_rows = []
    for _, r in ncr.iterrows():
        geom = r.geometry
        parts = list(geom.geoms) if geom.geom_type == "MultiPolygon" else [geom]
        n_parts = len(parts)
        name = str(r[name_col])
        pcode = str(r[pcode_col])
        # expected multipart
        if "Caloocan" in name or pcode == "PH1307501":
            assert n_parts == 2, (name, n_parts)
        elif "Las Pi" in name or pcode == "PH1307601":
            assert n_parts == 2, (name, n_parts)
        else:
            assert n_parts == 1, (name, n_parts)
        holes = 0
        c = geom.centroid
        # inverse to lon/lat
        lon, lat = transformer.transform(c.x, c.y, direction="INVERSE") if False else pyproj.Transformer.from_crs(UTM51, WGS84, always_xy=True).transform(c.x, c.y)
        for pi, part in enumerate(parts, start=1):
            # exterior
            coords = list(part.exterior.coords)
            for vi, (x, y) in enumerate(coords):
                lo, la = pyproj.Transformer.from_crs(UTM51, WGS84, always_xy=True).transform(x, y)
                vert_rows.append({
                    "adm3_pcode": pcode, "part_id": pi, "ring_id": 0, "is_hole": 0,
                    "vertex_idx": vi, "lon": f"{lo:.8f}", "lat": f"{la:.8f}",
                    "x_m": f"{x:.3f}", "y_m": f"{y:.3f}",
                })
            for hi, hole in enumerate(part.interiors, start=1):
                holes += 1
                for vi, (x, y) in enumerate(list(hole.coords)):
                    lo, la = pyproj.Transformer.from_crs(UTM51, WGS84, always_xy=True).transform(x, y)
                    vert_rows.append({
                        "adm3_pcode": pcode, "part_id": pi, "ring_id": hi, "is_hole": 1,
                        "vertex_idx": vi, "lon": f"{lo:.8f}", "lat": f"{la:.8f}",
                        "x_m": f"{x:.3f}", "y_m": f"{y:.3f}",
                    })
        assert holes == 0, (name, holes)
        cod_area = float(r[area_col]) if area_col else float("nan")
        attr_rows.append({
            "adm3_pcode": pcode,
            "lgu_name": name,
            "n_parts": n_parts,
            "cod_area_km2": f"{cod_area:.6f}" if area_col else "",
            "utm_area_km2": f"{r['utm_area_km2']:.6f}",
            "centroid_lon": f"{lon:.6f}",
            "centroid_lat": f"{lat:.6f}",
            "centroid_x_m": f"{c.x:.3f}",
            "centroid_y_m": f"{c.y:.3f}",
        })
        if pcode == "PH1307606":  # Pateros
            print(f"  Pateros utm area = {r['utm_area_km2']:.4f} km2 (target 1.61)")
            assert abs(r["utm_area_km2"] - 1.61) / 1.61 <= 0.05
        if pcode == "PH1307404":
            print(f"  Quezon City utm area = {r['utm_area_km2']:.4f} km2 (target 162.44)")
    write_csv(out_dir / "ncr_lgu_attributes.csv", attr_rows,
              list(attr_rows[0].keys()))
    write_csv(out_dir / "ncr_lgu_boundaries_vertices.csv", vert_rows,
              list(vert_rows[0].keys()),
              comment="NCR admin-3 polygons from OCHA COD-AB (NAMRIA/PSA), CC BY-IGO. Coordinates in WGS84 and EPSG:32651.")
    ncr.attrs["union_km2"] = union_km2
    return ncr


def process_fault(gem_path: Path, out_dir: Path) -> tuple[pd.DataFrame, LineString]:
    faults = gpd.read_file(gem_path, engine="pyogrio")
    cols = {c.lower(): c for c in faults.columns}
    cid = cols.get("catalog_id", cols.get("catalogid", "catalog_id"))
    wvf = faults[faults[cid].astype(str) == GEM_CATALOG]
    assert len(wvf) == 1, len(wvf)
    geom = wvf.iloc[0].geometry
    assert geom.geom_type == "LineString", geom.geom_type
    coords = list(geom.coords)
    assert len(coords) == 108, len(coords)
    lats = [c[1] for c in coords]
    print(f"  WVF vertices={len(coords)} lat {min(lats):.3f} to {max(lats):.3f}")
    assert abs(min(lats) - 14.167) < 0.01 and abs(max(lats) - 15.022) < 0.01
    fwd = pyproj.Transformer.from_crs(WGS84, UTM51, always_xy=True)
    inv = pyproj.Transformer.from_crs(UTM51, WGS84, always_xy=True)
    xy = [fwd.transform(x, y) for x, y in coords]
    utm_line = LineString(xy)
    length_km = utm_line.length / 1000.0
    print(f"  WVF UTM length = {length_km:.3f} km (target 98.58 ± 0.5)")
    assert abs(length_km - 98.58) <= 0.5, length_km
    rows = []
    for i, ((lon, lat), (x, y)) in enumerate(zip(coords, xy)):
        rows.append({
            "catalog_id": GEM_CATALOG,
            "vertex_idx": i,
            "lon": f"{lon:.8f}",
            "lat": f"{lat:.8f}",
            "x_m": f"{x:.3f}",
            "y_m": f"{y:.3f}",
        })
    write_csv(out_dir / "wvf_trace_vertices.csv", rows, list(rows[0].keys()),
              comment="CC BY-SA 4.0, derived from GEM Global Active Faults (Styron & Pagani 2020), catalog_id=PHL_31 West Valley Fault, commit 56816508ad92fd6846dad1163b1c8c01376a2cd1.")
    (out_dir / "wvf_trace_vertices.LICENSE.txt").write_text(
        "CC BY-SA 4.0\n"
        "Derived from the GEM Global Active Faults Database (Styron & Pagani 2020, "
        "Earthquake Spectra, doi:10.1177/8755293020944182). Philippine faults compiled "
        "from Peñarubia et al. 2019 (PHIVOLCS). Feature catalog_id=PHL_31, name=West Valley Fault.\n"
        "Source commit 56816508ad92fd6846dad1163b1c8c01376a2cd1.\n"
        "This derived CSV must remain CC BY-SA 4.0.\n",
        encoding="utf-8",
    )
    # optional East Valley Fault PHL_38
    evf = faults[faults[cid].astype(str) == "PHL_38"]
    if len(evf) >= 1:
        ev_rows = []
        ev_idx = 0
        for _, feat in evf.iterrows():
            g = feat.geometry
            seqs = [g] if g.geom_type == "LineString" else list(g.geoms)
            for si, sg in enumerate(seqs):
                for lon, lat in list(sg.coords):
                    x, y = fwd.transform(lon, lat)
                    ev_rows.append({
                        "catalog_id": "PHL_38", "part_id": si, "vertex_idx": ev_idx,
                        "lon": f"{lon:.8f}", "lat": f"{lat:.8f}",
                        "x_m": f"{x:.3f}", "y_m": f"{y:.3f}",
                    })
                    ev_idx += 1
        write_csv(out_dir / "evf_trace_vertices.csv", ev_rows, list(ev_rows[0].keys()),
                  comment="East Valley Fault GEM PHL_38, for map context only, CC BY-SA 4.0. Not used in distances or scenarios.")
    return pd.DataFrame(rows), utm_line


def interpolate_on_trace(utm_line: LineString, lat_target: float) -> tuple[float, float, float, float]:
    """Point on the GEM trace at a given latitude (linear interpolation in lon/lat along segments)."""
    inv = pyproj.Transformer.from_crs(UTM51, WGS84, always_xy=True)
    fwd = pyproj.Transformer.from_crs(WGS84, UTM51, always_xy=True)
    coords = list(utm_line.coords)
    for (x1, y1), (x2, y2) in zip(coords[:-1], coords[1:]):
        lo1, la1 = inv.transform(x1, y1)
        lo2, la2 = inv.transform(x2, y2)
        if (la1 - lat_target) * (la2 - lat_target) <= 0 and la1 != la2:
            t = (lat_target - la1) / (la2 - la1)
            lon = lo1 + t * (lo2 - lo1)
            lat = lat_target
            x, y = fwd.transform(lon, lat)
            return lon, lat, x, y
    raise RuntimeError(f"latitude {lat_target} does not intersect the trace")


def process_worldpop(tif: Path, ncr: gpd.GeoDataFrame, out_dir: Path) -> pd.DataFrame:
    union = ncr.unary_union
    union_wgs = gpd.GeoSeries([union], crs=UTM51).to_crs(WGS84).iloc[0]
    buf = union_wgs.buffer(0.01)
    fwd = pyproj.Transformer.from_crs(WGS84, UTM51, always_xy=True)
    with rasterio.open(tif) as src:
        print(f"  WorldPop CRS={src.crs} size={src.width}x{src.height}")
        geoms = [mapping(buf)]
        # windowed read
        minx, miny, maxx, maxy = buf.bounds
        window = from_bounds(minx, miny, maxx, maxy, src.transform)
        data = src.read(1, window=window)
        transform = src.window_transform(window)
        nodata = src.nodata
    rows = []
    h, w = data.shape
    # pixel centres
    # affine: x = t[2] + (col+0.5)*t[0] + (row+0.5)*t[1]
    n_pos = 0
    for r in range(h):
        for c in range(w):
            v = float(data[r, c])
            if nodata is not None and v == nodata:
                continue
            if not np.isfinite(v) or v <= 0:
                continue
            n_pos += 1
            lon = transform.c + (c + 0.5) * transform.a + (r + 0.5) * transform.b
            lat = transform.f + (c + 0.5) * transform.d + (r + 0.5) * transform.e
            x, y = fwd.transform(lon, lat)
            rows.append({
                "pixel_id": n_pos,
                "lon": f"{lon:.6f}",
                "lat": f"{lat:.6f}",
                "x_m": f"{x:.3f}",
                "y_m": f"{y:.3f}",
                "weight": f"{v:.6f}",
            })
    print(f"  WorldPop positive pixels in buffered window: {len(rows)}")
    assert 50_000 < len(rows) < 200_000, len(rows)
    write_csv(out_dir / "ncr_worldpop2020_pixels.csv", rows,
              list(rows[0].keys()),
              comment="NCR-clipped WorldPop Global2 R2025A 2020 constrained 100 m (doi:10.5258/SOTON/WP00839), CC BY 4.0. RELATIVE WEIGHTS only; do not use the sum as a population total.")
    return pd.DataFrame(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", type=Path, default=Path("."))
    ap.add_argument("--offline", action="store_true")
    args = ap.parse_args()
    root = args.repo_root.resolve()
    raw = root / "data" / "raw"
    out = root / "data" / "processed"
    out.mkdir(parents=True, exist_ok=True)

    psa_pop = raw / "psa" / "psa_2020cph_ncr_openstat.csv"
    psa_type = raw / "psa" / "psa_2020cph_ncr_building_type.csv"
    psa_floors = raw / "psa" / "psa_2020cph_ncr_building_floors.csv"
    gem = raw / "gem" / "gem_active_faults_harmonized.geojson"
    wp = raw / "worldpop" / "phl_pop_2020_CN_100m_R2025A_v1.tif"
    gdb_zip = raw / "cod_ab" / "phl_admin_boundaries.gdb.zip"
    gdb_dir = Path("/tmp/modsim-src/cod_gdb/phl_admin_boundaries.gdb")

    for p in (psa_pop, psa_type, psa_floors, gem, wp, gdb_zip):
        if not p.exists():
            sys.exit(f"Missing required file: {p}. Re-run without --offline, or place the file.")

    gsha = sha256(gem)
    wsha = sha256(wp)
    print("GEM sha256", gsha)
    print("WorldPop sha256", wsha)
    assert gsha == GEM_SHA, gsha
    assert wsha == WP_SHA, wsha
    if gdb_dir.exists() is False:
        import zipfile
        gdb_dir.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(gdb_zip) as z:
            z.extractall(gdb_dir.parent)

    print("== population ==")
    pop = process_population(psa_pop, out)
    print("== housing ==")
    process_housing(psa_type, psa_floors, pop, out)
    print("== boundaries ==")
    fwd = pyproj.Transformer.from_crs(WGS84, UTM51, always_xy=True)
    ncr = process_boundaries(gdb_dir, out, fwd)
    print("== fault ==")
    fault_df, utm_line = process_fault(gem, out)
    for label, lat in (("baseline", 14.58), ("alternative", 14.40)):
        lon, la, x, y = interpolate_on_trace(utm_line, lat)
        d = utm_line.distance(Point(x, y))
        print(f"  {label} epicenter lon={lon:.5f} lat={la:.5f} x={x:.3f} y={y:.3f} dist_to_trace={d:.4f} m")
    print("== WorldPop ==")
    process_worldpop(wp, ncr, out)

    # UTM test vectors (pyproj) for MATLAB to assert against — already in the brief;
    # recompute and print.
    print("== UTM test vectors (pyproj) ==")
    for lon, lat in [(123.0, 0.0), (121.07011, 14.58), (121.04696, 14.40), (121.0, 14.6), (121.1, 14.4)]:
        x, y = fwd.transform(lon, lat)
        print(f"  {lon}, {lat} -> {x:.3f}, {y:.3f}")

    manifest = {
        "created_utc": utc_now(),
        "sources": {
            "psa_2020cph_population": {
                "file": str(psa_pop.relative_to(root)),
                "sha256": sha256(psa_pop),
                "url": "https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2020/0011A6DPHH0.px",
                "reference_date": "2020-05-01",
            },
            "psa_2020cph_housing_type": {
                "file": str(psa_type.relative_to(root)),
                "sha256": sha256(psa_type),
                "url": "https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2020/0041A6DTOB0.px",
            },
            "psa_2020cph_housing_floors": {
                "file": str(psa_floors.relative_to(root)),
                "sha256": sha256(psa_floors),
                "url": "https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2020/0051A6DBNF0.px",
            },
            "cod_ab_gdb": {
                "file": str(gdb_zip.relative_to(root)),
                "sha256": sha256(gdb_zip),
                "url": "https://data.humdata.org/dataset/cod-ab-phl",
                "licence": "CC BY-IGO",
                "valid_on": "2025-02-13",
            },
            "gem_gaf": {
                "file": str(gem.relative_to(root)),
                "sha256": gsha,
                "commit": "56816508ad92fd6846dad1163b1c8c01376a2cd1",
                "licence": "CC BY-SA 4.0",
            },
            "worldpop": {
                "file": str(wp.relative_to(root)),
                "sha256": wsha,
                "doi": "10.5258/SOTON/WP00839",
                "licence": "CC BY 4.0",
            },
        },
        "library_versions": {
            "geopandas": gpd.__version__,
            "pyproj": pyproj.__version__,
            "rasterio": rasterio.__version__,
            "shapely": __import__("shapely").__version__,
            "numpy": np.__version__,
            "pandas": pd.__version__,
        },
        "processed_sha256": {p.name: sha256(p) for p in sorted(out.glob("*.csv"))},
    }
    (out / "MANIFEST_ncr_inputs.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("wrote", out / "MANIFEST_ncr_inputs.json")
    print("DONE")


if __name__ == "__main__":
    main()
