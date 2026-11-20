
You are a senior MATLAB simulation engineer . Inspect this repository and produce a decision-complete plan for finishing the existing NCR earthquake simulation. 

## Context and hard requirements

Read AGENTS.md and inspect the current code before proposing changes. Preserve the existing scientific model, provenance, and explicitly labelled assumptions. Reuse working capabilities and keep changes focused on scenario isolation, animations, verification, and associated documentation.

Plan exactly these three primary scenarios:

- A: 20 seconds, existing baseline epicenter in Pasig.
- B: 40 seconds, the same baseline epicenter.
- C: 40 seconds, existing alternative epicenter in Muntinlupa.

C intentionally replaces the previous primary 20-second alternative scenario. Identify the documentation and tests requiring this update. Retain any useful legacy or illustrative cases separately, without presenting them as additional primary scenarios.

“Sandbox” means an independent run with its own resolved configuration, calculation state, verification ledger, and output directory. Use one shared MATLAB engine with isolated scenario inputs and results; separate Git worktrees, containers, and duplicated implementations are unnecessary.

## Establish the starting state

Inspect configuration, runners, src/, tests/, and relevant reports. Useful starting points are:

- config/modsim_config.json
- run_scenarios.m
- src/casualty_accumulation.m

The repository already appears to contain a complete static workflow, wave-arrival calculations, casualty timelines, and an assumed shaking profile. Verify their actual behavior and identify reusable functions, hard-coded scenario IDs, output paths, and assumptions before planning additions.

Determine the available MATLAB version, export capabilities, and existing checks through read-only inspection. Use Context7 for documentation questions about relevant APIs or tools. Do not execute existing workflows that would overwrite committed results during planning.

## Scenario isolation and comparability

Specify a minimal interface for running A, B, or C independently, plus an orchestration entry point for all three and their comparison.

Each sandbox must save its scenario identity, resolved parameters, provenance, static results, animation data, and check outcomes. Prevent shared mutable state, output collisions, and dependence on execution order. Shared prepared exposure and geometry may be reused as read-only inputs.

Hold exposure, vulnerability, magnitude, fault geometry rules, occupancy, and unrelated parameters fixed. Apply the existing duration sensitivity consistently to B and C, clearly labelled ASSUMED. Use A versus B to examine duration sensitivity and B versus C to examine location at equal duration.

Preserve the finite-rupture ground-motion model. Changing epicenter may produce nearly identical final losses; explain that honestly. Do not substitute a point source, alter vulnerability, or exaggerate map differences to make the animations more dramatic.

## Animation deliverables

Plan three standalone scenario videos and one synchronized A/B/C comparison video, generated programmatically from computed simulation arrays.

Each scenario must show:

- North-up NCR damage grid, inactive-cell mask, LGU boundaries, West Valley Fault, and its assumed epicenter.
- Consistent map extent, equal axis scaling, legends, units, and shared color limits.
- Elapsed simulated time, configured shaking duration, scenario identity, and cumulative expected deaths and injuries.
- A final frame that agrees with the static scenario results.

Define the animated map quantity and its relationship to the static heavy-damage probability. Distinguish the assumed temporal progression from the final empirical fragility calculation. Do not present interpolated damage or casualty timing as a validated physical rupture simulation.

Inspect the existing onset and accumulation functions. Choose one coherent timing convention and document whether duration applies at the source or after local arrival. Ensure playback continues through the last cell’s completion, including travel-time offsets. Completed scenarios must hold their final state during the synchronized comparison.

Do not repeatedly add cumulative casualty values at each frame. Animation must not alter final model totals or apply duration scaling twice.

Choose concrete defaults for video format, frame rate, resolution, simulation sampling, playback speed, common comparison clock, final-frame hold, and output naming. Separate simulation time from playback time. Specify a compatible export fallback if the preferred encoder is unavailable. Avoid additional toolboxes unless demonstrably necessary.

## Verification and handoff

Define checks for:

- Independent runs versus the all-scenarios runner, reordered execution, and repeatability.
- Scenario output isolation and correct A/B/C epicenter-duration bindings.
- Probability bounds, zero-input behavior, exposure conservation, and all 17 LGUs including Pateros.
- Zero casualties before onset, nondecreasing cumulative counts, exact terminal totals, and no repeated accumulation.
- Unchanged numerical results when only animation sampling or playback settings change.
- Video existence, decodability, frame dimensions, common timing, readable labels, and final-frame agreement.

Separate checks already evidenced from checks proposed for implementation. Never claim unexecuted tests passed.

Return one implementation plan inside <proposed_plan> tags, covering:

1. Verified starting state and remaining gaps.
2. Minimal architecture and interface changes.
3. Animation specification and output artifacts.
4. Tests, acceptance criteria, documentation updates, and ordered implementation steps.

Resolve routine choices yourself and record defaults. Ask only about consequential ambiguities that repository inspection cannot resolve. Stop after delivering the plan; do not edit files, install dependencies, or run production simulations.
