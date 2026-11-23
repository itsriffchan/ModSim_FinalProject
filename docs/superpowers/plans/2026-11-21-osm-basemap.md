# OSM basemap swap (replaces three-geo / Mapbox) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace three-geo / Mapbox with OpenStreetMap raster tiles registered to the saved EPSG:32651 grid on Region, City, and Compare.

**Architecture:** Slippy-map tiles warped via utm51nForward + projectXY into Three.js meshes; shared in-memory image cache; graceful fallback keeps damage wash authoritative.

**Tech Stack:** Next.js 16, Three.js (vendored), Vitest, Playwright

---

See attached agent plan `osm_basemap_swap_427a2d43.plan.md` in Cursor plans for full file list, tests, and verification steps (spec: modsim-osm-basemap-handoff.md, 2026-11-21).