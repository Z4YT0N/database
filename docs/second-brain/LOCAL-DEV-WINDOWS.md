# Running Noted locally on Windows (no Docker)

What it took to get the whole stack — web + workers + Meilisearch + Gemini —
running end to end on a Windows dev machine without Docker Desktop, and the two
upstream bugs that block it. Verified working on 2026-08-30:
save a URL → crawl → AI tags → summary → embedding → hybrid search.

## Services

| Service | How it runs here | Port |
|---|---|---|
| web (Next.js 16) | `PORT=3005 pnpm web` | 3005 |
| workers | `pnpm workers` | ephemeral (metrics only) |
| Meilisearch v1.41.0 | `meilisearch.exe` from the official GitHub release, run directly | 7700 |

Port 3000 and 3001 are taken by other projects on this machine, hence 3005.
`PORT`, `NEXTAUTH_URL` and `API_URL` must all agree or the auth callbacks break.

Meilisearch is pinned to the exact version `docker/docker-compose.yml` uses, so
the local setup and a future Docker deploy index identically. It lives in
`C:/Users/Mahmoud/noted-data/meili/` alongside its `data.ms` and `masterkey`.

## Configuration

`DATA_DIR` points at `C:/Users/Mahmoud/noted-data` (outside the repo, so the
SQLite db and the assets can never be committed).

**The `.env` has to exist in four places.** Each process loads it relative to
its own cwd, and `pnpm --filter` runs every script inside its own package:

| Copy | Loaded by |
|---|---|
| `.env` (root) | turbo, and as the source of truth to copy from |
| `apps/web/.env` | Next.js (`next dev` reads the project dir) |
| `apps/workers/.env` | `import "dotenv/config"` in `apps/workers/index.ts` |
| `packages/db/.env` | `pnpm db:migrate` / `db:studio` (`drizzle.config.ts`) |

Miss the `packages/db` copy and the migration silently creates `db.db` inside
`packages/db/` instead of `DATA_DIR` — the app then starts against an empty
database. Edit the root copy and re-copy the other three.

### AI provider: Gemini via its OpenAI-compatible endpoint

`packages/shared/inference.ts` is just the OpenAI SDK with a configurable
`baseURL`, so Gemini works without any code change:

```
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
INFERENCE_TEXT_MODEL=gemini-3.7-flash
INFERENCE_OUTPUT_SCHEMA=structured
EMBEDDING_TEXT_MODEL=gemini-embedding-001
EMBEDDING_TEXT_MODEL_DIMENSION_OVERRIDE=1536
EMBEDDING_DIMENSIONS=1536
EMBEDDING_ENABLE_AUTO_INDEXING=true
```

Verified directly against the live API before wiring it up: strict
`json_schema` structured output works (that's what the tagging worker needs),
and `gemini-embedding-001` honours the OpenAI `dimensions` parameter, so its
native 3072 dims truncate to the 1536 the config expects.

`EMBEDDING_ENABLE_AUTO_INDEXING` is the non-obvious one: it defaults to **off**
whenever `OPENAI_BASE_URL` is set (`packages/shared/config.ts` treats a custom
base URL as "not the default OpenAI setup"). Without it every bookmark sits at
`embeddingStatus: pending` forever and semantic search returns nothing, with no
error anywhere.

## Two upstream bugs this fork now fixes

Both were found by running the pipeline, not by reading code. Both are in
`apps/workers`, both make crawling impossible — a Windows dev never gets a
single successful crawl without them.

1. **`parseSubprocess.ts` used `new URL(...).pathname`**, which yields
   `/C:/Users/...` on Windows. The spawned interpreter can't open that path, so
   every parse subprocess exits 1. Fixed with `fileURLToPath`.

2. **`network.ts` resolved hostnames only through `dns.Resolver`** (c-ares).
   When c-ares can't read the OS DNS config it silently falls back to
   `127.0.0.1`; if nothing listens there, every `resolve4`/`resolve6` fails with
   `ECONNREFUSED` and no URL is ever crawlable — which is exactly the state this
   machine is in (`dns.getServers()` returns `["127.0.0.1"]` while the real
   resolver is the router at `192.168.8.1`). Now falls back to `getaddrinfo`,
   under the same `dnsResolverTimeoutSec` budget. The SSRF guard is unchanged:
   every address the fallback returns still goes through `isAddressForbidden`,
   which the new tests in `network.test.ts` pin down.

## Line endings

`git config core.autocrlf` was `true`, so the Windows checkout was CRLF while
`oxfmt` requires LF — `pnpm preflight` failed on ~30 files nobody had touched.
Fixed locally with `core.autocrlf=false` + `core.eol=lf` and a fresh checkout.
Do this in any new clone on Windows **before** editing anything.

## What is still not wired up

- **No browser backend.** The crawler runs in "browserless mode": plain HTTP
  fetch + readability, so no screenshots, no full-page archive, and no JS-heavy
  site. Point `BROWSER_WEB_URL` at a Chrome with `--remote-debugging-port` (or
  the `docker/chrome` image) to get those back.
- **Adblocker list download fails** (`raw.githubusercontent.com` doesn't resolve
  through the same path). Non-fatal; it only matters with a real browser.
- Nothing is deployed anywhere persistent yet — see the open items in
  `HANDOVER.md`.
