# Second Brain — Phase 1: Repository Audit & Foundation Decision

> **Status:** Phase 1 (Research only — no code written yet).
> **Scope:** Deep source-level audit of 4 nominated OSS repos + a market sweep for alternatives, license analysis, primary-base decision, proposed architecture, MVP scope, roadmap, first tasks.
> **Method note:** Each repo was cloned/fetched and inspected at the source level (schema files, package.json, LICENSE text, CI configs, migrations) by dedicated research passes — not summarized from README alone. Anything not independently confirmed is explicitly marked **Needs verification**.

---

## 1. Executive Summary

- **القرار: Karakeep (`karakeep-app/karakeep`, formerly Hoarder) هو الـPrimary Base.**
- هو المشروع الوحيد من بين كل ما تمت مراجعته الذي ينفّذ فعليًا (كود حقيقي، ليس README) معظم حلقة *Capture → Understand → Organize → Connect(جزئيًا) → Resurface(غائب) → Act(جزئيًا)*: capture متعدد القنوات (browser ext لثلاث متصفحات + share-extension حقيقي على iOS/Android + API/CLI/MCP)، extraction (readability + OCR + PDF + full-page archival)، AI tagging/summarization، semantic search عبر embeddings حقيقية (ليس مجرد tags).
- **لكن هناك عائقان حقيقيان يجب مواجهتهما بوعي كامل، لا تجاهلهما:**
  1. **الترخيص AGPL-3.0** — يمنع تحويل الكود مباشرة إلى SaaS مملوك مغلق المصدر (closed-source) بدون شرط الـnetwork-use copyleft. هذا **قرار عمل + قانوني**، ليس تفصيلًا تقنيًا. مفصّل بالكامل في القسم 4.
  2. **قاعدة البيانات SQLite-only** — لا يوجد مسار Postgres في الكود الحالي. هذا سقف حقيقي لأي SaaS متعدد المستأجرين (multi-tenant)، لكنه قابل للحل لأن الكود مبني فوق Drizzle ORM (يدعم dialect مزدوج SQLite/Postgres)، فالبورت هو ترجمة schema وليس إعادة كتابة الاستعلامات من الصفر.
- **نسبة تقريبية مما يوفره Karakeep من المنتج النهائي: ~50-55%.** قوي جدًا في Capture + Understand + Organize + Search الأساسي. **غائب تقريبًا بالكامل**: Resurfacing Engine، Connections Engine بالمعنى متعدد الإشارات (multi-signal) المطلوب، Intent classification، Spaces مع AI-suggestion، Feedback loop، وHome experience الهادئة المطلوبة. هذه بالضبط الميزات التي تميّز "Second Brain" الحقيقي عن Bookmark Manager — أي أن الجزء الأصعب والأهم تجاريًا **لم يكن موجودًا جاهزًا في أي مشروع تمت مراجعته**، ويجب بناؤه نحن.
- **البدائل رُفضت جميعًا كـPrimary Base** لأسباب محددة (وليس "كلهم جيدون"): Arivu غير ناضج تجاريًا (مشروع فردي عمره ~2.5 شهر) رغم كونه أفضل مرجع مفاهيمي لـResurfacing/Connections الفعلي؛ Khoj data model مبني حول "مستندات تملكها" وليس "أشياء تلتقطها من الويب/السوشيال" — عدم توافق بنيوي؛ Reor مشروع Electron محلي لمستخدم واحد **تم أرشفته رسميًا في مارس 2026** (ميت)؛ Linkwarden جيد في الأرشفة لكن بدون semantic search حقيقي وهويته المنتجية "team bookmarking" وليست "شخصي"؛ Omnivore/Shiori/Recally استُبعدت (مغلقة/بلا AI/ترخيص تجاري معادٍ).
- كل تحليل مبني على فحص كود فعلي (schema.ts، package.json، LICENSE، CI workflows، migrations) موثّق بالمسارات في كل قسم.

---

## 2. Repository Comparison Matrix

| # | المعيار | **Karakeep** | Arivu | Khoj | Reor | Linkwarden* | Omnivore* | Shiori* |
|---|---|---|---|---|---|---|---|---|
| 1 | Tech Stack | TS/Next.js16/Hono/tRPC | Go monolith | Python Django+FastAPI | Electron/TS | Next.js/TS | — | Go |
| 2 | Architecture | Monorepo, plugin-based | Modular monolith | Monolith (Django+FastAPI) | Single-process desktop | Monorepo | — | Single binary |
| 3 | Frontend | Next.js16/React19/shadcn | Vanilla JS/CSS (no framework) | Next.js15 static export | React18/Tamagui | Next.js | — | Basic web |
| 4 | Backend | Hono+tRPC v11 | Go net/http | Django+FastAPI | Electron main (N/A server) | Next.js API | — | Go |
| 5 | Database | **SQLite only** (Drizzle) | SQLite only | **Postgres only** | None (markdown files) | Postgres (assumed) | — | SQLite/Postgres/MySQL |
| 6 | Search engine | Meilisearch | SQLite FTS5 | pgvector cosine + SearXNG | LanceDB kNN + keyword | Needs verification | — | Basic |
| 7 | Vector DB | Meilisearch (as vector store) | **None** (linear scan BLOB) | pgvector | LanceDB (local, embedded) | **None found** | — | None |
| 8 | Background workers | Node workers, plugin queue | SQLite-backed job queue | APScheduler (leader-election) | None (in-process) | Needs verification | — | None |
| 9 | Queues | liteque (default, SQLite) / Restate (optional) | SQLite table-based | None (scheduler-driven) | N/A | Needs verification | — | N/A |
| 10 | Auth | NextAuth v4 + generic OIDC | Custom session (bcrypt/argon2) | Django auth + Google OAuth + phone | N/A (local single-user) | Needs verification | — | Basic |
| 11 | Storage | Local disk **or S3-compatible** | Local (no cloud abstraction) | Inline in Postgres (no S3 confirmed) | Local filesystem only | Needs verification | — | Local |
| 12 | AI integration | OpenAI-compatible + Ollama | 17-provider abstraction (1 implemented: Gemini) | OpenAI/Anthropic/Google + agents/MCP | Ollama/OpenAI/Anthropic via Vercel AI SDK | Ollama/OpenAI/Anthropic (tagging only) | — | None |
| 13 | Embeddings | Configurable (OpenAI/Ollama) → Meilisearch | Gemini embedding-2, BLOB, linear scan | sentence-transformers, pluggable | transformers.js (local ONNX) | **Not confirmed** | — | None |
| 14 | Content extraction | Readability+metascraper+Playwright+OCR(tesseract.js)+PDF+full-page archival | Readability + isolated Playwright capture service, SSRF-shielded | Org/MD/PDF/DOCX/GitHub/Notion connectors | Plain markdown read only | Screenshot+PDF+single-file archival (strong) | — | Basic |
| 15 | Browser extension | **MV3, Chrome+Firefox+Safari** | MV3 Chrome only | **None** | **None** | Yes + Floccus sync | — | No |
| 16 | Mobile app | **Expo/RN, real iOS+Android share-extension** | None (PWA only) | Android TWA only (thin wrapper, no iOS) | None | Native iOS/Android | — | No |
| 17 | API quality | OpenAPI 3.0 (35 paths) + tRPC + SDK + CLI + MCP | REST-ish, no OpenAPI, no public API design | FastAPI, no versioning/OpenAPI site | N/A (Electron IPC only) | Needs verification | — | Basic REST |
| 18 | Testing | Vitest unit + dedicated e2e package + CI matrix | 40 Go test files, full CI (govulncheck etc.) | pytest + eval suite, CI matrix | Weak (91 lines total, no CI test step) | Needs verification | — | Needs verification |
| 19 | Code quality | TS strict, oxlint/oxfmt, sherif, Husky | Careful, terse, AI-agent-authored | ruff+mypy+pre-commit | TS strict but redundant UI libs | Needs verification | — | Needs verification |
| 20 | Activity | **Very active** (commits days old, weekly releases) | Active in bursts, solo, 2.5 months old | Very active, long-running beta | **Archived Mar 2026, dead** | Active | **Shut down/dead** | Active |
| 21 | Community | **28.7k★, ~196 contributors, Discord** | 5★, 0 forks, 1 contributor | 36.8k★, 2.4k forks | 8.6k★ (frozen) | 19.6k★, 656 issues | dead | 11.6k★ |
| 22 | Scalability | Plugin-swappable search/queue, **but core DB is SQLite** | SQLite ceiling, in-process similarity | Single Postgres, no cache/queue layer | Not applicable (local-only) | Needs verification | — | Simple, low scale |
| 23 | Extensibility | **Strong**: plugin arch, webhooks, rule engine, MCP | Modular but no plugin/webhook system | **Strong**: pluggable LLM/scraper/MCP/Agents | Modular internals, no ext. surface | Needs verification | — | Minimal |
| 24 | License | **AGPL-3.0** | **MIT** | **AGPL-3.0-or-later** (clients: GPL-3.0) | **AGPL-3.0** | **AGPL-3.0** | AGPL-3.0 | GPL/MIT-family (verify) |
| 25 | Commercial fit | Open-core SaaS OK; closed-source fork blocked without separate license | **No legal blocker at all** | Same AGPL blocker + wrong data model | Same AGPL blocker + dead project | Same AGPL blocker | Dead — moot | Permissive but no AI |
| — | **Score /10 (as primary base for this exact product)** | **7.5** | 4.5 (idea-mine only) | 5 | 1.5 | 6.5 (secondary reference) | 2 (dead) | 2 (no AI) |

\* Linkwarden/Omnivore/Shiori were audited via a market-sweep pass, not a full dedicated file-by-file pass like the four named repos — details flagged accordingly. Recally and `raold/second-brain` were also screened and rejected early (scored 3-4/10 — Recally's AGPL variant is explicitly non-commercial without a paid vendor license, which is *worse* than plain AGPL for this use case; `raold/second-brain` is a 29★ research prototype, not a product base).

---

## 3. تحليل كل Repository (تفصيلي)

### 3.1 Karakeep (`karakeep-app/karakeep`) — المُختار

**بنية حقيقية (موثّقة من الكود):**
- Monorepo: pnpm + Turborepo. `apps/` = web, workers, mobile, browser-extension, cli, mcp, landing. `packages/` = api, trpc, db, shared, shared-react, shared-server, open-api, sdk, plugins, benchmarks, e2e_tests.
- **Database**: Drizzle ORM، **SQLite حصريًا** (`drizzle-orm/sqlite-core`, `better-sqlite3`) — 94 migration ناضجة. جداول رئيسية: `bookmarks`, `bookmarkLinks/Texts/Assets`, `assets`, `highlights`, `userReadingProgress`, `tagsOnBookmarks`, `bookmarkLists`, `listCollaborators/Invitations`, `customPrompts`, **`chatSessions`/`chatMessages`** (بنية Ask-My-Brain جاهزة جزئيًا!)، `rssFeeds`, `webhooks`, `ruleEngineRules/Actions`, **`subscriptions`** (بها حقول Stripe جاهزة!)، `importSessions`, `apiKeys`.
- **Search/Vector**: Meilisearch (v1.41 مثبّت في docker-compose) يُستخدم كـ full-text وكـ vector store معًا عبر `packages/plugins/vectorstore-meilisearch` — لا يوجد pgvector أو DB منفصلة للـembeddings.
- **Queue**: `liteque` (SQLite-backed, لا يحتاج Redis) افتراضيًا، مع بديل اختياري `Restate` (durable execution). Rate limiting منفصل (in-memory أو Redis).
- **Auth**: NextAuth v4 + Credentials + generic OIDC slot (SSO مع أي IdP قياسي).
- **Storage**: قابل للتوصيل — local disk أو S3-compatible (`@aws-sdk/client-s3`).
- **AI**: عميل استدلال قابل للتوصيل (`packages/shared/inference.ts`) يدعم OpenAI (أو أي endpoint متوافق) و Ollama. Embeddings عبر عميل منفصل قابل للتهيئة بشكل مستقل.
- **Extraction**: `@mozilla/readability` + `metascraper`، Playwright (وليس Puppeteer كما يوحي الاسم أحيانًا) للـcrawling، `tesseract.js` للـOCR، `pdf2json`/`pdfjs-dist`/`pdf2pic` للـPDF، `monolith`/`single-file-core` للأرشفة الكاملة للصفحة، `yt-dlp` لأرشفة الفيديو (بدون transcription مؤكد — **Needs verification**، سنتحقق منها مباشرة في كود الـworkers قبل Phase 4).
- **Browser extension**: Manifest V3، **Chrome + Firefox + Safari** (v0.32) — حقيقي وليس ادعاء.
- **Mobile**: Expo/React Native، **share-extension حقيقي** عبر `expo-share-intent` (iOS activation rules لـURLs/صور/PDF/نص، Android intent filters لـ`text/*`/`image/*`/`application/pdf`) — هذا بالضبط ما يطلبه المنتج (Instagram→Share→حفظ).
- **API**: OpenAPI 3.0 كامل (35 مسار موثّق)، بالإضافة إلى tRPC داخليًا، SDK رسمي بـTypeScript، CLI، وMCP server رسمي.
- **جودة الكود**: TypeScript `strict: true`، oxlint/oxfmt (أسرع من eslint/prettier)، `sherif` (فحص صحة monorepo)، Husky، CI شامل (lint/format/typecheck/tests/e2e منفصلة لكل من android/ios/chrome/extension/cli/mcp/sdk/docker).
- **النشاط**: commit بتاريخ قريب جدًا من الفحص، إصدارات متتالية (v0.31 → v0.32 بميزات فعلية: Safari extension، LLM OCR، CLI revamp)، **~28.7k star، ~196 contributor**، فريق الصيانة نفسه يشغّل SaaS مدفوع فعليًا على نفس الكود (`cloud.karakeep.app`) — دليل عملي أن نموذج AGPL-commercial قابل للحياة.

**أهم فجوة**: لا يوجد أي أثر لـ Resurfacing Engine أو Connections Engine بالمعنى المطلوب (متعدد الإشارات: intent + entities + temporal + repeated interest)، لا Intent classification، لا Spaces بذكاء اصطناعي، لا Feedback loop (useful/hide/more-like-this). هذه هي الفجوة الأساسية التي سنبنيها نحن.

### 3.2 Arivu (`glnarayanan/arivu`)

مشروع Go حقيقي **يعمل فعليًا** (`go build`/`go test` نجحا بالكامل)، وليس مجرد فكرة أو README — لكنه:
- عمره ~2.5 شهر فقط (أول commit 2026-06-15)، **5 نجوم، 0 forks، مؤلف واحد** (268 من أصل 275 commit من شخص واحد، والباقي من أدوات AI coding agents وليس بشرًا آخرين). سبق أن مرّ بإعادة كتابة كاملة (كان Python/FastAPI/MongoDB/React ثم أُعيد كتابته بالكامل بـGo/SQLite) — إشارة خطر على الاستقرار المعماري.
- **الترخيص MIT نظيف تمامًا** — لا عائق قانوني إطلاقًا لإعادة استخدام الكود أو الأفكار.
- **القيمة الحقيقية**: يحتوي فعليًا على "Insight Detectors" حتمية (deterministic) تُطابق تمامًا ما يطلبه المنتج:
  - **Forgotten-value detector**: عناصر مهمة (`importance >= 3`) لم يُطّلع عليها منذ 90+ يومًا — قاعدة بسيطة وليست خوارزمية spaced-repetition حقيقية (لا SM-2، لا forgetting-curve) — فجوة يمكن لمنتجنا التفوق فيها.
  - **Serendipitous-connection detector**: عناصر من مصادر مختلفة تشترك concept واحد ولم تُربط يدويًا بعد — مع الاستشهاد بالدليل (evidence span) من كل مصدر.
  - **Emerging-theme detector**: مقارنة تكرار concepts بين نافذتين زمنيتين (30 يومًا) مع شرط تنوّع المصادر.
  - **Evidence-first scoring**: كل insight يحمل `ScoreComponents{Evidence, Specificity, Diversity, Temporal, Novelty}` + استشهاد نصّي فعلي بالمصدر — مبدأ "لا توصية بدون دليل" يستحق التبنّي حرفيًا كمبدأ منتج، بغض النظر عن الكود.
  - **Feedback suppression**: جدول `knowledge_feedback` يخفي التوصيات المرفوضة نهائيًا من التوليد المستقبلي.
- **القرار**: لا يُستخدم كـbase (غير ناضج تجاريًا: SQLite فقط، لا vector DB حقيقي، لا mobile، frontend بلا framework)، لكنه **أفضل مرجع مفاهيمي موجود لـResurfacing/Connections** بين كل ما رُوجع — سيُستخدم كمرجع تصميم للـAlgorithm في Phase 6-7، وليس كمصدر كود.

### 3.3 Khoj (`khoj-ai/khoj`)

- Python (Django ORM + FastAPI)، Postgres+pgvector فقط، APScheduler (بدون Celery/Redis)، multi-provider LLM abstraction قوي جدًا (OpenAI/Anthropic/Google + "operator" agent بأسلوب computer-use + MCP client)، اختبارات حقيقية (pytest + eval suite لجودة المحادثة).
- **عدم توافق بنيوي حاسم**: `Entry.EntryType` = `{IMAGE, PDF, PLAINTEXT, MARKDOWN, ORG, NOTION, GITHUB, CONVERSATION, DOCX}` و `EntrySource` = `{COMPUTER, NOTION, GITHUB}` فقط — **لا يوجد مفهوم "احفظ رابط من الويب/السوشيال ميديا" في الـdata model إطلاقًا**. لا browser extension، لا share-sheet، لا social importer. الـweb search (SearXNG) يُستخدم فقط كإثراء لحظي للإجابة، وليس كحفظ دائم لعنصر.
- الترخيص: **AGPL-3.0-or-later** للنواة، لكن **تطبيقات العميل (Electron desktop / Obsidian plugin / Emacs) مرخّصة GPL-3.0-or-later منفصلة** — تفاوت تراخيص داخل نفس المشروع يستحق مراجعة قانونية خاصة. ملاحظة مهمة: منطق الفوترة (Stripe subscriptions) موجود **داخل** الكود المرخّص AGPL نفسه، مما يؤكد سريان AGPL على أي نسخة معدّلة تتضمن الفوترة أيضًا.
- **الخلاصة**: محرك RAG/Agents ممتاز *لو كان المنتج* "تحدّث مع ملفاتك/Notion/GitHub الموجودة مسبقًا" — لكنه ليس مناسبًا كأساس لمنتج "احفظ أي شيء من الويب والسوشيال" لأن طبقة الـcapture بأكملها غائبة وتحتاج بناء من الصفر فوقه، مما يُفرغ فكرة "لا تُعِد الاختراع" من قيمتها.

### 3.4 Reor (`reorproject/reor`)

- **حقيقة حاسمة**: المستودع **تمت أرشفته رسميًا في 7 مارس 2026** من قِبل المالك، وأصبح read-only دائمًا. آخر commit فعلي كان 13 مايو 2025 — أي **15+ شهرًا بلا أي نشاط** فعليًا قبل الأرشفة الرسمية.
- Electron + React + LanceDB (embedded vector DB) + transformers.js (embeddings محلية بالكامل عبر ONNX) — تطبيق سطح مكتب لمستخدم واحد فقط، الملفات (`.md`) على القرص المحلي هي مصدر الحقيقة، **لا يوجد خادم، لا حساب مستخدم، لا مصادقة، لا مفهوم متعدد المستخدمين إطلاقًا**، ولا يوجد mobile app ولا browser extension في كامل الـorg.
- الترخيص AGPL-3.0 أيضًا يمنع إعادة الاستخدام كمنتج SaaS مغلق، والمشروع ميت فلا يوجد حتى جهة تفاوض معها لترخيص تجاري.
- **القيمة**: تقنيات جديرة بالاقتباس معماريًا (وليس كودًا) — توليد embeddings محلي عبر transformers.js، إعادة الترتيب بـcross-encoder بعد بحث المتجهات (بي-إنكودر ثم cross-encoder rerank)، البحث الهجين (vector+keyword+فلترة بالتاريخ)، وواجهة "Similar Entries" البسيطة لعرض الروابط دون الحاجة لرسم بياني معقّد.
- **القرار**: مرجع معماري فقط لتقنيات RAG/embeddings، **غير صالح كأساس إطلاقًا** لمنتج سحابي متعدد المستخدمين.

### 3.5 البدائل الأخرى (مسح سوقي)

- **Linkwarden**: الأقوى في حفظ/أرشفة الصفحات بدقّة عالية (screenshot + single-file HTML + Wayback fallback)، تطبيقات mobile حقيقية + browser ext + Floccus sync. لكن **لا يوجد semantic search/embeddings مؤكد** (AI tagging فقط)، وهويته المنتجية أقرب لـ"team bookmarking تعاوني" منها لـ"ذاكرة شخصية". AGPL-3.0 أيضًا. **مرجع ثانوي محتمل** لطبقة الأرشفة فقط، وليس أساسًا بديلاً.
- **Omnivore**: استحوذت عليه ElevenLabs نهاية 2024 ثم **أُغلقت الخدمة وحُذفت بيانات المستخدمين نهاية نوفمبر 2024**. المستودع نفسه غير مؤرشف رسميًا لكن بلا دعم مؤسسي، بنية تحتية معتمدة على GCP يصعب استضافتها ذاتيًا، ولا AI/embeddings إطلاقًا. **مرفوض تمامًا**.
- **Shiori**: Go بسيط جدًا، بلا أي AI ("no AI and no frills" — توصيف مجتمعي موثّق)، صالح فقط كمرجع لمكتبات Go خفيفة (readability/warc) وليس كأساس منتج.
- **Recally**: واعد على الورق (يلتقط threads من X/Twitter وTelegram bot — أقرب شيء لـ"social capture" رأيناه) لكن غير ناضج (42 نجمة فقط)، ومعظم الميزات الأساسية "قيد التطوير"، **والأهم: ترخيصه AGPL لكن للاستخدام غير التجاري فقط، ويتطلب ترخيصًا تجاريًا مدفوعًا من المطوّر للاستخدام التجاري** — وهذا أسوأ من AGPL العادي لمنافس تجاري. **مرفوض**.
- **Memos / AFFiNE**: أدوات تدوين/لوح أبيض أولاً (note-first)، وليست "احفظ أي شيء والذكاء الاصطناعي ينظّمه" — غير مناسبة كأساس، لم تُراجع بعمق حسب التوجيه.

---

## 4. Licensing Comparison & Commercial Usage Implications

> ⚠️ **هذا القسم معلومات تقنية/عملية لدعم قرارك، وليس استشارة قانونية نهائية. يجب مراجعته مع محامٍ متخصص في تراخيص Open Source قبل أي إطلاق تجاري.**

| المشروع | الترخيص المؤكّد | Fork؟ | تعديل؟ | بيع كـSaaS مغلق المصدر؟ | نشر الكود مطلوب؟ |
|---|---|---|---|---|---|
| Karakeep | AGPL-3.0 (نص FSF كامل، بلا Commons Clause، بلا dual-license) | نعم | نعم | **لا، ليس كما هو** | نعم — عند التشغيل كخدمة شبكية (network-use clause) |
| Arivu | **MIT** | نعم | نعم | **نعم، بلا قيود** | لا |
| Khoj | AGPL-3.0-or-later (Core) / GPL-3.0-or-later (عملاء Electron/Obsidian/Emacs) | نعم | نعم | **لا** | نعم لنفس السبب، + تعقيد إضافي من ازدواج الترخيص بين النواة والعملاء |
| Reor | AGPL-3.0 | نعم (لكن مشروع ميت) | نعم | **لا** | نعم (نظريًا فقط، لا جهة لمقاضاتها فعليًا لكن الالتزام قانوني إن أُعيد النشر) |
| Linkwarden | AGPL-3.0 | نعم | نعم | **لا** | نعم |

**النقطة الجوهرية (AGPL §13 — network-use clause):** بخلاف GPL العادي الذي يُفعَّل فقط عند *توزيع* الكود، AGPL يُفعَّل عند **تفاعل المستخدمين مع الخدمة عبر الشبكة** — حتى لو لم توزّع أي ملف تنفيذي. أي: لو أخذت كود Karakeep، عدّلته، وشغّلته كخدمة سحابية يستخدمها الناس، فأنت *ملزم* بإتاحة الكود المصدري الكامل لنسختك المعدّلة **لكل مستخدمي تلك الخدمة**.

**هذا يعني عمليًا لا يمكن:**
- أخذ Karakeep، إضافة ميزات Resurfacing/Connections/Ask-My-Brain الخاصة بنا، وتشغيله كـSaaS **مغلق المصدر بالكامل**.

**المسارات التجارية الواقعية الثلاثة (يجب اختيار واحد كقرار عمل):**

1. **Open-core / Open-source SaaS** (نفس نموذج فريق Karakeep أنفسهم على `cloud.karakeep.app`): تبقى منصّتك بأكملها مفتوحة المصدر تحت AGPL، والربح يأتي من الاستضافة/الدعم/السهولة، وليس من احتكار الكود. **الأقل مخاطرة قانونيًا، الأسرع للبدء هندسيًا.** هذا هو الافتراض الافتراضي الذي سنبني عليه المخطط الهندسي أدناه ما لم يُتّخذ قرار عمل مختلف.
2. **ترخيص تجاري منفصل من الشركة المالكة** (Localhost Labs Ltd، مالكة Karakeep): لا يوجد أي دليل في المستودع (لا COMM-LICENSE، لا ذكر في README/CONTRIBUTING) على وجود برنامج ترخيص تجاري مُعلن — **Needs verification: يتطلب تواصلًا مباشرًا معهم لمعرفة إن كانوا يقدّمون dual-license**. لو وافقوا، هذا يفتح الباب لمنتج مغلق المصدر بالكامل.
3. **إعادة كتابة نظيفة (clean-room) مستوحاة فقط من المعمارية/الـschema/الميزات**: بلا أي مخاطرة قانونية، لكنها تُلغي عمليًا فائدة "لا تبدأ من الصفر" — تصبح إعادة كتابة كاملة تقريبًا، وهو ما طلبتَ تجنّبه صراحةً.

**توصيتي كمعماري**: ابدأ بالمسار 1 (Open-core) لأنه لا يعطّل أي عمل هندسي فوري، وشغّل المسار 2 (التواصل مع Localhost Labs Ltd) كمسار عمل موازٍ منذ اليوم الأول — إن نجح المسار 2 لاحقًا يمكن الانتقال لموديل مغلق المصدر دون إعادة كتابة أي كود. **هذا قرار عمل يستحق مكالمة مع محامٍ Open Source قبل أي إعلان علني للمنتج.**

**علامة تجارية**: لا يوجد ملف TRADEMARK.md في Karakeep — لكن ترخيص AGPL لا يمنح أي حقوق على اسم "Karakeep" أو شعاره بحكم الأساس القانوني (الترخيص = حقوق نشر، وليس علامة تجارية). يجب إعادة التسمية بالكامل بغض النظر عن القرار الترخيصي أعلاه — وهو أمر ستفعله على أي حال لبناء هوية منتج مستقلة.

---

## 5-7. Primary Base: القرار والتبرير

### القرار: **Karakeep**

### لماذا Karakeep

1. **أقرب تطابق تقني حقيقي (وليس نظري) لحلقة Capture→Understand→Organize→Search**: browser extension حقيقي لثلاث متصفحات، share-extension حقيقي على iOS/Android (وهذا تحديدًا أهم ميزة طلبتها — "Instagram → Share → Second Brain" — موجودة وتعمل بالفعل عبر `expo-share-intent`)، pipeline استخراج محتوى ناضج (readability+OCR+PDF+full-page archival)، AI tagging/summarization مع embeddings حقيقية وليس مجرد كلمات مفتاحية.
2. **بنية جاهزة بالفعل لميزات نظن أننا سنبنيها من الصفر**: جدول `chatSessions`/`chatMessages` موجود مسبقًا (أساس Ask-My-Brain جاهز جزئيًا)، جدول `subscriptions` بحقول Stripe (أساس Billing جاهز)، `webhooks` + `ruleEngineRules/Actions` (أساس Act/Automation جاهز)، بنية plugin نظيفة لتبديل الـQueue/Search/VectorStore/RateLimit بدون كسر الكود.
3. **الأكثر نشاطًا ونضجًا بفارق كبير**: ~28.7k نجمة، ~196 مساهمًا، commits يومية تقريبًا، CI صارم (lint/format/typecheck/tests/e2e لكل من web/mobile/extension/cli/mcp/sdk)، TypeScript صارم بالكامل. لا مشروع آخر رُوجع يقترب من هذا المستوى من النضج الهندسي.
4. **دليل عملي أن نموذج AGPL-commercial يعمل**: فريق الصيانة نفسه يشغّل SaaS مدفوعًا (`cloud.karakeep.app`) على نفس الترخيص — هذا يزيل شكوكًا افتراضية حول جدوى المسار التجاري المفتوح المصدر.
5. **API-first حقيقي**: OpenAPI + SDK + CLI + MCP — يسهّل بناء تكاملات مستقبلية (agents، أتمتة) دون إعادة اختراع الطبقة.

### لماذا رُفض كل بديل

- **Arivu**: أفضل *فكرة* لكن أضعف *تنفيذ تجاري* — مشروع فردي عمره أسابيع، بلا مجتمع، بلا vector DB حقيقي، بلا mobile، وسبق أن أُعيد كتابته بالكامل مرة (خطر استقرار معماري). يُستخدم كمرجع خوارزميات فقط.
- **Khoj**: محرك AI/RAG الأقوى تقنيًا من بين الأربعة، لكن الـdata model بأكمله مبني حول "مستندات تملكها مسبقًا" لا "أشياء تلتقطها من الويب" — تبنّيه كأساس يعني بناء طبقة capture كاملة من الصفر فوقه، مما يُلغي أي وفر زمني حقيقي.
- **Reor**: مُؤرشف رسميًا وميت (لا نشاط منذ 15+ شهرًا)، معماريته (سطح مكتب محلي لمستخدم واحد بلا خادم) بعيدة كليًا عن SaaS سحابي متعدد المستخدمين — يحتاج إعادة كتابة كاملة، ليس بورت.
- **Linkwarden/Omnivore/Shiori/Recally**: إمّا ميت (Omnivore)، أو بلا AI (Shiori)، أو ترخيص تجاري أسوأ (Recally)، أو هوية منتج مختلفة (Linkwarden = تعاوني team-bookmarking وليس ذاكرة شخصية) وبلا semantic search حقيقي.

### النسبة التقريبية

**Karakeep: ~50-55% foundation.** قوي جدًا في الطبقة السفلى (infra: auth, storage, queue, search, extraction, capture surfaces) وضعيف/غائب في الطبقة العليا المميِّزة تجاريًا (Connections الحقيقي، Resurfacing، Intent، Spaces الذكية، Feedback loop، Home experience الهادئة) — وهذه هي بالضبط الـ45-50% المتبقية التي ستحدّد نجاح المنتج، ويجب بناؤها بعناية فائقة لأنها الـmoat الحقيقي.

---

## 8. ما الذي سنعيد استخدامه من الـBase (Reuse)

- Auth (NextAuth + OIDC)، monorepo tooling (pnpm/Turborepo)، tRPC + OpenAPI API layer، Drizzle ORM patterns (مع تغيير الـdialect لاحقًا)، pipeline الاستخراج بالكامل (readability/metascraper/Playwright/tesseract.js/pdf tooling/monolith)، Browser extension (MV3، 3 متصفحات)، Mobile app + share-extension mechanism، بنية الـplugins (Queue/Search/VectorStore/RateLimit)، Webhooks + Rule Engine كأساس لـ"Act"، جداول `chatSessions/chatMessages` و`subscriptions` كنقطة انطلاق لـAsk-My-Brain وBilling، CI/CD pipelines كاملة، SDK/CLI/MCP.

## 9. ما الذي سنبنيه نحن (Build)

- Memory abstraction (توسيع `bookmarks` schema)، Intent classification، Connections Engine (multi-signal)، Resurfacing Engine (scoring model + Home feed)، Feedback Loop، Spaces مع AI-suggestion، Ask-My-Brain UI مع مصادر مستشهد بها، ترحيل قاعدة البيانات إلى Postgres، طبقة Billing كاملة، Video transcription، Observability/Analytics، Home experience الهادئة الجديدة.

---

## 10. Architecture المقترحة (النهائية)

| الطبقة | القرار | السبب |
|---|---|---|
| **Frontend** | إبقاء Next.js 16 App Router + React 19 + Tailwind + shadcn (موجود) — إعادة تصميم الواجهة (Home/Library) فقط، وليس استبدال الستاك. | لا داعي لإعادة اختراع stack ناضج؛ التغيير مطلوب في UX/IA وليس في التقنية. |
| **Backend** | إبقاء Hono + tRPC v11، توسيع الـrouters لميزات Memory/Connections/Resurfacing/Ask. | نفس السبب. |
| **Database** | **ترحيل من SQLite إلى Postgres** عبر تبديل ملف الـschema من `sqlite-core` إلى `pg-core` (نفس ORM — Drizzle يدعم الاثنين). | ضروري لأي SaaS متعدد المستأجرين حقيقي (كتابة متزامنة، عزل بيانات، نسخ احتياطي مُدار). البورت هو ترجمة schema/migrations وليس إعادة كتابة استعلامات. |
| **Search + Vector** | **إبقاء Meilisearch فقط** (بدون إضافة pgvector كنظام موازٍ). | هو مُدمج بالفعل وناضج، يدعم hybrid keyword+semantic، قابل للتوسّع (clustering)، وأرخص/أبسط من تشغيل Elasticsearch/OpenSearch أو نظامي متجهات معًا — يطابق أولويات "البساطة + الجودة + التكلفة" التي طلبتَها. |
| **Queue** | استبدال `liteque` (SQLite-only) بحل Postgres-native مُختبر (`pg-boss` أو `graphile-worker`) عبر واجهة الـ`QueueClient` القابلة للتوصيل الموجودة أصلًا. | يتجنّب كتابة/صيانة queue مخصّص فوق Postgres، ويستفيد من بنية الـplugin الجاهزة. Redis يبقى اختياريًا لاحقًا فقط لـrate-limiting/caching، وليس ضروريًا من اليوم الأول. |
| **Object Storage** | تفعيل مسار S3-compatible (موجود) كافتراضي بدل local-disk. | متطلب أساسي لأي نشر SaaS متعدد المستأجرين. |
| **Caching** | Redis اختياري لاحقًا (rate-limit + تخزين نتائج resurfacing/connections المكلفة). | مؤجّل حتى الحاجة الفعلية — تجنّب تعقيد مبكر. |
| **AI Gateway / LLM abstraction** | توسيع `packages/shared/inference.ts` القائم بإضافة Anthropic وGemini خلف نفس الواجهة، مع قاعدة توجيه: نموذج رخيص لـ(tagging/summary/intent)، نموذج أكبر فقط عند أسئلة Ask-My-Brain المعقّدة. | يطابق طلبك بتقليل التكلفة دون الارتباط بمزوّد واحد، ودون إفراط في التجريد في v1. |
| **Embeddings** | إبقاء عميل embeddings القابل للتوصيل (OpenAI افتراضيًا، Ollama للخصوصية). | موجود ويعمل. |
| **Content extraction / OCR** | إبقاء الـpipeline الحالي بالكامل. | ناضج وشامل. |
| **Video transcription** | **إضافة جديدة** (Whisper API أو self-hosted whisper.cpp) — غير موجودة في Karakeep حاليًا (Needs verification قبل البدء). | مطلوبة لفهم محتوى Reels/TikTok/YouTube الفعلي، وليس فقط العنوان/الصورة المصغّرة. |
| **API** | إبقاء OpenAPI/tRPC/SDK/CLI/MCP. | جاهزة وقوية. |
| **Mobile** | إبقاء Expo/RN + share-extension، تحسين تجربة "حفظ في ثوانٍ بلا احتكاك". | الأساس موجود ويعمل فعليًا. |
| **Browser Extension** | إبقاء MV3 لثلاث متصفحات، تعزيز التقاط النص المحدد والمحتوى الكامل. | موجود أصلًا. |
| **Observability** | إضافة: structured logging (pino)، OpenTelemetry، Sentry، توسيع Prometheus metrics الموجودة في workers لتغطي الـweb أيضًا. | غير موجودة اليوم بالمستوى المطلوب لـSaaS إنتاجي. |
| **Analytics** | إضافة أداة تحليل منتج (PostHog) — مع الحرص على "logs بلا محتوى حساس". | لقياس فعالية Resurfacing/Feedback loop لاحقًا. |
| **Auth** | إبقاء NextAuth، إضافة أزرار Google/Apple مباشرة (فوق الـOIDC العام) لتجربة onboarding استهلاكية أسهل. | تحسين تجربة مستخدم بدون تغيير البنية. |
| **Billing** | توسيع جدول/حقول `subscriptions`/Stripe الموجودة فعليًا. | أساس جاهز، يوفّر وقتًا حقيقيًا. |
| **Deployment** | Docker Compose (موجود) للتطوير/self-host، ومنصّة سحابية مُدارة (Postgres مُدار + Meilisearch Cloud/cluster + S3 + Redis اختياري) للإنتاج — مانيفستات Kubernetes الموجودة نقطة انطلاق جيدة. | يقلّل عمل DevOps من الصفر. |

### أهم Architectural Risks

1. **غموض النموذج التجاري (AGPL)** — الخطر الأهم، يجب حسمه قبل أي إعلان علني (قسم 4).
2. **ترحيل SQLite→Postgres** — يحتاج migration tooling حقيقي لنقل بيانات المستخدمين الحاليين إن وُجدت، واختبار دقيق لأي دالة SQLite-specific متبقية.
3. **Meilisearch كنظام بحث/متجهات وحيد عند الحجم الكبير** — لم يُختبر أداؤه على عشرات آلاف العناصر لكل مستخدم في سياقنا؛ يحتاج spike تحميل مبكر.
4. **تكلفة AI** — Connections/Resurfacing قد تُضاعف عدد نداءات الـLLM/embeddings لكل عنصر محفوظ إن لم تُصمَّم من اليوم الأول حول batching + caching + content-hash deduplication.
5. **تصميم Home/Feed الهادئ** — خطر الانزلاق نحو "dashboard بلا روح" أثناء إعادة استخدام مكتبة مكوّنات جاهزة إن لم يُلتزم بفلسفة التصميم بدقة.
6. **Video transcription تكلفة/تعقيد جديد** بالكامل غير موجود في الأساس، يحتاج ميزانية تشغيلية منفصلة.
7. **متابعة upstream نشط جدًا (إصدارات شبه أسبوعية)** — قرار مبكر مطلوب: fork-and-diverge أم تتبّع upstream مع patches؟ الانحراف الكبير مبكرًا يصعّب دمج تحديثات الأمان لاحقًا.
8. **لا يوجد API رسمي لجلب "Saved Items" من Instagram/TikTok/X** — الاعتماد على Share Extension/Browser Extension/yt-dlp-style scraping يبقى هشًا تشغيليًا أمام تغييرات المنصّات (مخاطرة مستمرة وليست فقط لمرحلة V1).
9. **العلامة التجارية** — يجب التخلي عن اسم/شعار "Karakeep" بالكامل بغضّ النظر عن المسار الترخيصي.

---

## 12. MVP Scope (بعد الحذف الهندسي)

**تم الحذف عمدًا** (deferred، وليس مُلغى للأبد): Video transcription، Intent taxonomy الكامل (12 فئة) → نبدأ بـ6، تعقيد Connections الكامل (multi-signal) → نبدأ بـ(semantic + shared tags/entities + temporal فقط)، Spaces مع AI-suggestion → يدوي فقط في V1، Feedback loop المتقدّم (more-like-this/less-like-this) → نبدأ بـ(useful/hide) فقط، Collaborative lists/multi-user sharing (موجودة في الأساس لكن غير مطلوبة للرؤية الفردية)، RSS ingestion، Webhooks/Rule-engine كأتمتة للمستخدم النهائي، Billing metering متقدّم.

**يبقى في MVP**: Auth (Email + Google)، Save URL/Note/Image/Screenshot/PDF، Browser Extension، Share Extension (mobile)، Content extraction، AI tagging+summary+intent(6 فئات)+topics/entities بنداء LLM واحد مُجمَّع، Embeddings، Hybrid Search (Meilisearch)، Library مع فلاتر، Ask My Brain (RAG بسيط + استشهاد بالمصادر)، Related Memories (connections أساسي)، Basic Resurfacing (scoring بسيط: أهمية × قِدَم × لم-يُفتَح، مع أقسام Home: "يستحق العودة إليه"/"مُلتقط مؤخرًا"/"مرتبط بما تعمل عليه")، Feedback (useful/hide فقط)، Responsive Web App.

---

## 13-14. Development Roadmap & أول 10 Tasks

| Phase | الهدف | أهم التغييرات |
|---|---|---|
| **0** | إعداد المستودع + حسم المسار القانوني | Fork، rebrand، بيئة تطوير، CI، بدء تواصل قانوني موازٍ |
| **1** | Core Memory Model | توسيع schema بحقول Memory الجديدة (إضافية، متوافقة خلفيًا) |
| **2** | ترحيل قاعدة البيانات | Postgres + pg-core schema + queue جديد (pg-boss/graphile-worker) |
| **3** | تعزيز Capture Pipeline | التحقق من "حفظ خلال ثوانٍ"، idempotency، content hashing |
| **4** | AI Understanding Pipeline | نداء LLM واحد مُجمَّع (تلخيص+intent+topics+tags+entities+أهمية)، إضافة Anthropic/Gemini، caching بالـhash |
| **5** | Search & Library | ضبط دقة Meilisearch الهجين، واجهة Library بالفلاتر |
| **6** | Connections Engine | إشارات متعددة (semantic + tags/entities مشتركة + قرب زمني + تكرار موضوع) |
| **7** | Resurfacing Engine | نموذج scoring + أقسام Home + ربط الـFeedback |
| **8** | Ask My Brain | واجهة RAG فوق `chatSessions/chatMessages` مع استشهاد بالمصادر |
| **9** | Feedback Loop & Spaces | useful/hide يؤثر في scoring، Spaces يدوية بسيطة |
| **10** | Production Hardening | Billing فعلي، Observability، مراجعة أمنية (عزل بيانات/تشفير/تصدير/حذف حساب)، اختبار حِمل، حسم قانوني نهائي |

**أول 10 مهام عملية للبدء الآن:**

1. تواصل قانوني مبدئي مع Localhost Labs Ltd (مالكة Karakeep) للاستفسار عن ترخيص تجاري منفصل — مسار موازٍ، غير معطِّل.
2. Fork الكود إلى مستودع خاص، تشغيله محليًا بالكامل (web+workers+meilisearch) عبر docker-compose، والتأكد من نجاح كل الاختبارات.
3. Rebrand أولي (اسم الحزمة، الشعارات، إزالة أي إشارة لعلامة Karakeep التجارية).
4. تفعيل CI الحالي على الـfork والتأكد من نجاحه كما هو.
5. كتابة migration إضافية (additive) على جدول `bookmarks`: `intent`, `topics` (jsonb), `entities` (jsonb), `importance_score`, `quality_score`, `last_resurfaced_at`.
6. Spike: نسخة موازية من `schema.ts` بصيغة `pg-core`، تشغيل Postgres محليًا، تنفيذ الـmigrations، والتحقق من نجاح مجموعة فرعية من الاستعلامات — لتقليل مخاطرة Phase 2 قبل الالتزام الكامل.
7. توسيع `packages/shared/inference.ts` بإضافة Anthropic وGemini خلف نفس الواجهة، مع طبقة caching بالـcontent-hash.
8. دمج نداءات AI المتفرّقة في نداء واحد بمخرجات مُهيكلة (structured output) وقياس التكلفة/الكمون.
9. تصميم taxonomy الأولي لـIntent (6 فئات)، إضافته لروترات tRPC، وعنصر تحكّم بسيط في الواجهة لتغييره يدويًا.
10. نموذج أولي (pure function مُختبرة بـunit tests) لدالة Resurfacing scoring على بيانات تجريبية، وأول قسم "يستحق العودة إليه" في الـHome خلف feature flag.

---

## 15. Assumptions تحتاج إثباتًا مباشرًا من داخل الكود قبل الالتزام الهندسي

- هل يقدّم Localhost Labs Ltd (مالكة Karakeep) ترخيصًا تجاريًا/dual-license؟ — غير مؤكد، لم يُعثر على أي دليل في المستودع، يتطلب تواصلًا مباشرًا.
- هل يتضمّن معالج الفيديو الحالي (`apps/workers`) أي transcription فعلي، أم أرشفة فقط عبر yt-dlp؟ — يجب التحقق من كود الـworker مباشرة قبل تخطيط Phase 4/فيديو.
- سلوك تخزين الأصول (assets) الافتراضي بالتحديد عند عدم ضبط S3 — يجب التحقق قبل قرار Phase 2/التخزين.
- أداء/كمون Meilisearch الهجين عند عشرات آلاف العناصر لكل مستخدم — ادّعاء غير مُختبر، يحتاج spike تحميل مبكر.
- الحالة القانونية الدقيقة لاسم/شعار "Karakeep" كعلامة تجارية — لم يُعثر على TRADEMARK.md، خطر منخفض مُفترَض وليس مؤكَّدًا قانونيًا.
- العدد الدقيق للمساهمين (~196) ووتيرة الإصدارات الدقيقة — مصدرها بحث ويب وليس استدعاء API مباشر، يستحق تأكيدًا مستقلاً.
- البنية التحتية الفعلية لـ`cloud.karakeep.app`/`app.khoj.dev` على الأرجح تختلف عن docker-compose العام — غير مؤكَّدة.
