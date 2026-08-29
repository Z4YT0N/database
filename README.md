<div align="center">
    <a href="https://github.com/Z4YT0N/database/actions/workflows/ci.yml">
        <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/Z4YT0N/database/ci.yml" />
    </a>
</div>

# Noted

Noted is a personal, self-hosted "second brain": save anything (links, notes,
screenshots, PDFs, videos), let AI understand and tag it, search it with
hybrid full-text + semantic search, and ask questions over everything you've
saved. Built for personal use by a small circle of people on one self-hosted
instance — not a public SaaS.

This project is a fork of the excellent open-source
[Karakeep](https://github.com/karakeep-app/karakeep) (formerly *Hoarder*),
created and maintained by [Localhost Labs Ltd](https://localhostlabs.co.uk).
See [NOTICE.md](./NOTICE.md) for full attribution and a list of what has been
changed in this fork. Noted is, and remains, licensed under
[AGPL-3.0](./LICENSE) — see [License](#license) below.

## Features (inherited from Karakeep)

- Bookmark links, take simple notes and store images and PDFs.
- Automatic fetching for link titles, descriptions and images.
- Sort your bookmarks into lists.
- Full text & semantic search of all the content stored.
- LLM-based automatic tagging and summarization, with support for local
  models via Ollama.
- Powerful [CLI](./apps/cli), [MCP server](./apps/mcp), and REST API — agent
  friendly.
- Rule-based engine for customized management.
- OCR for extracting text from images.
- Browser extension (Chrome/Firefox/Safari) and mobile apps (iOS/Android)
  with a real share-sheet integration for quick, low-friction capture.
- Mobile offline reading.
- Auto-archiving from RSS feeds.
- Mark and store highlights from saved content.
- Full page archival (via [monolith](https://github.com/Y2Z/monolith)) to
  protect against link rot.
- Auto video archiving via [yt-dlp](https://github.com/yt-dlp/yt-dlp).
- Bulk actions, SSO, dark mode, multi-language support.

## What's different in this fork

See [docs/second-brain/PHASE-1-FOUNDATION-AUDIT.md](./docs/second-brain/PHASE-1-FOUNDATION-AUDIT.md)
for the full research/architecture writeup behind this project, and
[NOTICE.md](./NOTICE.md) for the concrete list of changes made so far
(rebranding, build-locally Docker images, dropped upstream marketing/docs
site). The plan going forward is to layer a real **Connections engine**,
**Resurfacing engine**, **Intent classification**, and an **Ask My Brain**
chat surface on top of this foundation — see the roadmap in that document.

## Stack

- [Next.js](https://nextjs.org/) for the web app (App Router).
- [Drizzle](https://orm.drizzle.team/) for the database and its migrations
  (SQLite).
- [NextAuth](https://next-auth.js.org) for authentication.
- [tRPC](https://trpc.io) for client-server communication.
- [Playwright](https://playwright.dev/) for crawling bookmarks.
- OpenAI-compatible / Ollama for AI tagging, summarization and embeddings.
- [Meilisearch](https://meilisearch.com) for full-text and semantic search.

## Self-hosting

This is meant to run as a single self-hosted instance for personal/small-group
use — see `docker/docker-compose.yml` (builds the app from this repo's source,
no external registry required):

```bash
cd docker
cp .env.sample .env   # fill in NEXTAUTH_SECRET, etc.
docker compose up -d --build
```

## License

Noted is licensed under [AGPL-3.0](./LICENSE), same as the upstream project
it's forked from. See [NOTICE.md](./NOTICE.md) for attribution details.
