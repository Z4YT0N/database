# Notice

**Noted** is a fork of [Karakeep](https://github.com/karakeep-app/karakeep)
(formerly known as *Hoarder*), an open-source project created and maintained
by [Localhost Labs Ltd](https://localhostlabs.co.uk). All credit for the
original architecture, design, and the vast majority of the code in this
repository goes to the Karakeep maintainers and contributors.

- Upstream project: https://github.com/karakeep-app/karakeep
- Upstream license: GNU Affero General Public License v3.0 (AGPL-3.0)
- This fork is, and remains, licensed under the same terms — see
  [LICENSE](./LICENSE). Nothing in this fork removes or narrows the rights
  AGPL-3.0 grants to anyone who receives a copy of this software, including
  the right to the corresponding source of any modified version running as
  a network service.

This is a personal, non-commercial fork built for use by one person and a
small circle of friends/acquaintances on a single self-hosted instance —
it is not operated as a public or commercial service.

## What has been changed so far in this fork

- **Rebranding**: product name changed from "Karakeep"/"Hoarder" to "Noted"
  throughout the codebase, configuration, mobile app metadata, and browser
  extension manifest. Legacy "Hoarder" references (old bundle IDs, migration
  guide docs) were updated or removed where they no longer applied.
- **Dropped from the vendored copy** (not needed for a personal fork, and
  removed to cut unnecessary size/maintenance surface):
  - `docs/` — the upstream Docusaurus multi-version documentation website.
  - `apps/landing/` — the upstream public marketing landing page.
  - `screenshots/` — upstream marketing screenshots.
- **Docker images now build from source** instead of pulling upstream
  pre-built images from `ghcr.io/karakeep-app/*`: `docker/docker-compose.yml`,
  `docker/docker-compose.build.yml`, `docker/docker-compose.dev.yml`, and the
  two secondary tooling compose files now `build:` the `web` and `chrome`
  services locally (see `docker/Dockerfile` and `docker/chrome/Dockerfile`).
  This fork does not publish any container images to a public registry.
- **CI publishing workflows disabled**: `.github/workflows/docker.yml` and
  `chrome.yml` (which pushed images to the upstream project's container
  registry) are now `workflow_dispatch`-only, since this fork has no
  configured registry/credentials to push to. The lint/format/typecheck/test
  workflow (`ci.yml`) is unchanged and still runs automatically.
- **Repository/update-check links** (README badges, in-app "check for
  updates" links, package `repository`/`bugs` metadata) now point at this
  fork's repository (`github.com/Z4YT0N/database`) instead of upstream.
- **App-store / cloud-service links removed**: the upstream README linked to
  a hosted Chrome/Firefox/Safari extension listing, iOS/Android app store
  listings, a hosted demo, and a hosted "Karakeep Cloud" offering — none of
  which apply to this personal fork, so those claims were removed rather than
  left inaccurate.

## Planned, not-yet-built changes

See [docs/second-brain/PHASE-1-FOUNDATION-AUDIT.md](./docs/second-brain/PHASE-1-FOUNDATION-AUDIT.md)
for the full research and roadmap behind this fork — the intent is to extend
the Memory/Bookmark model with intent classification, a Connections engine,
a Resurfacing engine, a feedback loop, and an "Ask My Brain" chat surface,
while keeping this AGPL-3.0 base intact.
