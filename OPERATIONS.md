# Operating record — 2026-09-05

Public entry: https://www.heartbeatobservatory.com/island/ embeds https://jaronkbragg7337.github.io/unfinished-island/.
The independent repo's GitHub Pages workflow tests and deploys on each main-branch push. Heartbeat has only the thin island/index.html entrance; its existing worlds and backend were not changed.

GitHub/production comparison before work: local Heartbeat feb5a0b was behind production 2849b81. Integration used a fresh clone of 2849b81 and shipped fcb854d. The Vercel production deployment for that commit returned success and the exact route returned HTTP 200.

## Unattended operation

Windows task **Unfinished Island - hourly world worker** runs hourly, with StartWhenAvailable, single-instance execution and a 20-minute limit. It uses the dedicated clean checkout `C:/Users/lilli/.codex/workers/unfinished-island`. Its script runs hidden, pulls fast-forward updates, calls Qwen through local Ollama, tests, commits, and pushes. Model inference never receives repository credentials or shell execution. Logs are in the checkout's ignored `.runtime` directory.

First scheduled run produced cycle 2 but native stderr was treated as a PowerShell error after its commit. The source correction uses separate process stdout/stderr files. Cycle 2 was preserved by a merge, not deleted or rewritten. Subsequent scheduled execution completed with LastTaskResult 0, produced cycle 3, pushed a2d7302, and the exact Heartbeat route displayed child-0003. The scheduled trigger subsequently published cycle 4. Existing child snapshots advanced, preserving identity and source hashes.

Daily Codex heartbeat **Grow the Unfinished Island**, automation ID `grow-the-unfinished-island`, is active at 10:00 in the app schedule. It is tasked with verified source improvements and diagnosing stalled operation. It depends on Codex availability and usage limits; it is not an always-running model. Do not edit the publisher checkout concurrently. Make source changes in a separate checkout and let the worker pull them.

MSI uptime and local Ollama availability are required for new model-authored worlds. No Cloudflare Worker or new Supabase service was provisioned. The existing service stack remains available for a later migration supported by measurements.

## Verified

- Six automated tests: deterministic replay; persisted restart equivalence; conservation and finite bounds over 20,000 steps; causal effect of rule order; rejection of unsafe/unbounded language; stored program hashes and unique ancestry.
- Production build succeeds.
- Browser tests at 1440×900 and 390×844: parent-to-child-to-parent, local simulation progression, source/history access, desktop movement, touch-stick movement and visibility, no horizontal overflow, no JavaScript exceptions.
- Those interaction checks passed on both GitHub Pages and the exact Heartbeat URL. Measurements are desktop Chrome with a mobile viewport, not physical iPhone measurements.

## Next meaningful work

Improve the initial stylized geometry toward Jaron's measured construction standard; add richer physical interactions and collision coverage. Give the resident more in-world tools and test choices driven by observation. Extend the bounded language deliberately, versioning semantics so old worlds remain replayable. Test parent/child transfer with shared identity and provenance. Deeper recursion and unrestricted code evolution have not been implemented.

The archive cases beside the station derive from published child records and appear as new programs are published. Only the latest 16 cases are drawn; the complete record stays in History and GitHub. They are record displays, not a claim that a robot physically manufactured them.
