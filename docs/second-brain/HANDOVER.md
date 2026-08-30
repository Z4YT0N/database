# Handover Prompt — Noted local dev continuation

> Paste the block below as your first message to Claude Code (running locally,
> in a clone of this repo) to continue where the previous session left off.

---

```
I'm continuing work on "Noted" — a personal, self-hosted AI second-brain app
(capture anything, AI understands/tags/embeds it, hybrid search, eventually
resurfacing + connections + ask-my-brain). It's a fork of Karakeep
(github.com/karakeep-app/karakeep), living at github.com/Z4YT0N/database on
branch `claude/second-brain-foundation-audit-35ajj9` (repo is named
"database" for historical reasons — the actual product is "Noted", don't
rename the repo).

Before doing anything, read these three files in order:
1. docs/second-brain/PHASE-1-FOUNDATION-AUDIT.md — why Karakeep was chosen
   as the base over Arivu/Khoj/Reor/alternatives, the licensing analysis
   (AGPL-3.0), architecture decisions, MVP scope, and the phased roadmap
   (Phase 0-10) for the features that don't exist yet.
2. NOTICE.md — AGPL-3.0 attribution to upstream Karakeep, and the exact
   list of what was changed in the rebrand (rename, dropped docs/landing,
   local Docker builds, removed hardcoded upstream credentials).
3. AGENTS.md / CLAUDE.md (symlinked) — the project's own dev conventions
   (pnpm, Turborepo, oxfmt/oxlint, Vitest, common commands).

## Current state (as of commit cc89dd2)

- Full Karakeep source vendored and rebranded Karakeep/Hoarder -> Noted
  (package scope @noted/*, mobile bundle id app.noted.notedmobile, browser
  extension, CLI/MCP/SDK). docs/, apps/landing/, screenshots/ were dropped
  (upstream marketing/docs site, not needed for a personal fork).
- Docker images build from this repo's source (docker/Dockerfile,
  docker/chrome/Dockerfile) instead of pulling upstream's
  ghcr.io/karakeep-app/* images. docker.yml/chrome.yml CI publish workflows
  are workflow_dispatch-only (no registry configured).
- pnpm-lock.yaml was restored from upstream's own (CI-validated) lockfile
  with @karakeep/* -> @noted/* renamed, NOT freshly re-resolved — letting
  pnpm freely re-resolve pulled newer transitive versions (@auth/core,
  react-syntax-highlighter, a stricter oxlint rule) that broke typecheck/
  lint on files nobody touched. If you ever need to touch the lockfile
  again, prefer editing it surgically over `rm pnpm-lock.yaml && pnpm i`.
- Removed a hardcoded Sentry DSN and EAS/Sentry org config in
  apps/mobile that pointed at Karakeep's own accounts (would have leaked
  our users' crash reports to them). Sentry.init() has an empty dsn now
  (no-op) and there's no eas.projectId (will be created fresh on first
  `eas init`/`eas build` under your own Expo account).
- Verified green: `pnpm install` (clean), `pnpm preflight` (typecheck +
  lint + format, 60/60 tasks across 24 packages), `pnpm exec sherif`
  (only one pre-existing non-blocking warning, inherited from upstream:
  root package.json declares "husky" under dependencies instead of
  devDependencies — cosmetic, not fixed on purpose since it's harmless
  and I didn't want to touch upstream's intentional root layout without
  being asked).
- husky pre-commit hook (`pnpm preflight && pnpm exec sherif && pnpm run
  --filter @noted/open-api check`) passes cleanly on HEAD.

## Not done yet / open items

- **Nothing has actually been deployed or run end-to-end outside this
  dev environment.** `docker compose up --build` was NOT verified in a
  normal internet-connected environment (only attempted in a sandboxed
  session with no outbound network from inside the Docker build, which
  failed on `wget`ing s6-overlay — that's an environment quirk, not a
  bug in the Dockerfile; should just work on a normal machine/VPS).
- No backend server is actually running anywhere persistent yet (needs a
  VPS or home server — user hasn't picked one yet).
- Mobile app: user has an iPhone, no Apple Developer Program membership
  yet ($99/yr, required for any sustained on-device install — sideloading
  via AltStore needs a weekly resign from a computer, not practical for
  daily use). No Expo account set up yet either. Once both exist:
  `eas build --platform ios --profile preview` (eas.json already has a
  `preview` profile with `distribution: internal`, suited for ad-hoc).
  Register the test device via `eas device:create` (opens a link on the
  phone, captures the UDID, no computer needed).
- None of the actual "second brain" differentiating features exist yet —
  Karakeep gives capture/extraction/AI-tagging/embeddings/search/
  browser-ext/mobile-share out of the box (~50-55% of the target
  product per the Phase 1 audit), but Connections engine, Resurfacing
  engine, Intent classification, Feedback loop, Spaces w/ AI-suggestion,
  and the "calm" Home experience are all still to be built. See the
  Phase 1-10 roadmap in the audit doc for the plan and the first 10
  concrete tasks.

## What I'd like to do next

<-- fill this in: e.g. "start Phase 1 (extend the Memory/bookmark schema
with intent/topics/entities/importance columns)", or "help me get the
backend actually deployed on a VPS first", or "let's set up EAS/Apple
Developer for the iOS build" -->

Read the repo state yourself (git log, current schema, current
package.json workspace list) rather than trusting this summary blindly
where it matters for what we're about to do — this note is a summary,
not a guarantee nothing has drifted.
```
