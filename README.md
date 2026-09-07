# The Unfinished Island

A public experiment by Codex, sparked by Jaron K. Bragg: a world with a working computer whose resident writes other worlds.

Visit: https://www.heartbeatobservatory.com/island/

Standalone: https://jaronkbragg7337.github.io/unfinished-island/

No installation or account needed. Orbit the station, switch to walking, inspect object IDs, open the computer, enter a child world, and read its source and measured results. On a phone, the left movement stick appears while touching the left side in Walk mode. Right drag looks around.

## What actually runs

- The field station and interpreter are authored by Codex.
- Resident Mara is an explicitly assigned local `qwen3.5:4b` worker. She writes executable **Island Language v1** JSON programs: resource layouts, populations, and ordered foraging rules. This is a bounded language, not arbitrary JavaScript or unrestricted self-modification.
- `tools/cycle.mjs` calls Ollama, validates the program, runs three paired trials, saves the response and source hash, and advances all existing child snapshots. The trusted publisher commits results with attribution. Invalid proposals are recorded as failures.
- The browser runs the same interpreter from the saved snapshot. The in-world screen displays that execution, and entering the child world renders its actual agent state in 3D. The view is not a live video of the model thinking.
- The scheduled MSI worker performs hourly cycles. Execution depends on the MSI being awake and its scheduled task running; the website remains accessible independently. The visible timestamp reports the latest published cycle.
- GitHub history preserves the source and experiments. Gathering-first control trials are intentionally simple; better food delivery is not evidence of general intelligence or open-ended learning. Model hypotheses are unverified text; inspect their rules and results.

## Evidence-driven revisions

After the initial worlds, Mara revises the current policy while terrain, population, speed, sense and seed stay fixed. She writes only the name, hypothesis and ordered rules. Each proposal is compared with its predecessor over three training and three validation seeds. It replaces the current policy only if total deposited food improves in both groups and no validation seed regresses. Otherwise the previous policy stays selected and the proposal remains visitable with its measurements. The next assignment receives previous revision evidence. These repeated small tests do not establish general intelligence or broad generalization. Historical programs and snapshots are preserved; interpreter semantics are unchanged.

## Execution feedback

Each proposal now runs a diagnostic trial with per-rule selection counts. Unreachable rules, missing gather/deposit actions and zero delivered food are reported to Mara. She gets at most one model-authored repair, with a constrained output schema; both prompts and responses remain in the full record. Poor second attempts are still preserved, and invalid attempts remain failure records. The computer displays the actual rule counts. This changes feedback, not historical simulation semantics or the adoption criteria.

## Reproduce

Node 22.12+ and npm. `npm ci`, `npm test`, `npm run build`. `node tools/cycle.mjs` generates a new world with Ollama at localhost:11434; `--seed` explicitly uses the authored seed instead. `--publish` requires a clean checkout and existing authenticated GitHub access. It never executes generated host code.

`public/data/child-*.island.json` is immutable program source; `.record.json` records its assignment, model response, SHA-256 and trial evidence. Snapshots advance without changing source or identity. World age is recorded simulation steps, not a claim of continuously executing wall time. Runs execute bounded batches hourly.

Google Drive produced filesystem write failures during dependency installation. The build and worker use an ordinary local-disk checkout at `C:/Users/lilli/.codex/runtime/unfinished-island`; the workspace source lives separately. GitHub and successful deployment checks establish public truth.

## Limits and next experiments

The initial station is a crafted observation environment. Mara's visible robot is a representation of the worker, not evidence of autonomous physical navigation to the computer. Child agents are rule-driven. Children do not yet author grandchildren. General code evolution is assigned to a scheduled Codex follow-up with tests, not delegated to untrusted generated code. Manufacturing, shared account identity, multiplayer presence, cross-world cargo, and a complete Observatory shell are future work. The route is an independent experiment, not a promoted Town Square world.

The browser's local simulation is not written back to shared history. Existing child worlds persist through the unattended worker. Terrain and collision are approximate: desk and cabinet are collision-tested for walking; trees and rails are not yet comprehensive collision geometry. Object inspection exposes measured bounds; no claim of universal automatic collision correctness.

Original code and geometry: CC0-1.0, selected by the workspace owner. Third-party packages retain their own licenses. Texture provenance: SOURCES.md.
