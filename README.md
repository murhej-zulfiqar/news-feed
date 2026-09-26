# Frontpage

A customizable content aggregator that pulls RSS and Atom feeds into one well-designed reading dashboard.

**Live URL:** _not yet deployed — see [Known Limitations](#known-limitations)_

---

## Overview

Frontpage is a frontend-only RSS/Atom feed reader: add feeds by URL, organize them into categories, read items in a distraction-free reader view, and track what you've read — all without an account. Everything is stored in the browser (IndexedDB), and a Next.js API route does the actual feed fetching and parsing server-side, since RSS/Atom can't be fetched directly from the browser due to CORS.

On first visit, the dashboard seeds itself with the 19 curated feeds from `data/sample-feeds.json` across 5 categories (Frontend, Design, Backend & DevOps, General Tech, AI & ML) and fetches them in the background, so the "empty app" problem never happens — you land in a populated dashboard immediately.

This build covers the **Core** feature set (feed management, parsing, browsing, categories, read/unread tracking, article/reader view, responsive design, error handling) plus the three design-it-yourself features (onboarding, digest, layout customization). It does not include the Stretch features (bookmarks, search, OPML import/export, auto-refresh polling UI beyond a basic interval, keyboard navigation) or a differentiator — see [Known Limitations](#known-limitations) and [Differentiators](#differentiators) for why, and what I'd add next.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Database | None — IndexedDB via `idb-keyval`, in the browser |
| Authentication | None (frontend-only path — see `spec/technical-requirements.md`'s Frontend-Only Alternative) |
| Feed fetching | Next.js API route (`/api/feed`), server-side `fetch` with a 10s timeout, ETag/Last-Modified caching, per-host rate limiting |
| Feed parsing | `fast-xml-parser`, with custom RSS 2.0 / Atom / RSS 1.0 (RDF) normalization, date parsing, and encoding detection |
| Sanitization | `DOMPurify`, for rendering feed-sourced HTML in the reader view |
| Hosting | Not yet deployed |
| Styling | Tailwind CSS v4 + the provided `starter/tokens.css` design tokens |
| Icons | `lucide-react` |

---

## Design Decisions

These are the product and design choices I made where the spec left room for interpretation.

### Content Discovery & Onboarding

**The problem I was solving:** New users (and in this frontend-only build, *every* user — there's no guest vs. signed-up distinction) land on an empty dashboard with no feeds and no idea what a good RSS feed URL even looks like.

**My approach:** The dashboard seeds itself automatically on first visit with the 19 curated feeds from `data/sample-feeds.json`, organized into their 5 source categories, and fetches them in the background while showing skeleton loading states. There's no separate "onboarding flow" to click through — you land directly in a populated, real dashboard. If someone removes all their feeds later (or wants to start over), the same "Load 19 curated feeds" action reappears in the empty state on `/app` and on `/app/feeds`, and it's idempotent (skips URLs already subscribed), so it's safe to hit more than once. Adding a feed manually is a plain inline form (URL + category) on `/app/feeds` — no modal, per the pattern guidance against gating routine actions behind dialogs.

**Why I chose this approach:** The technical-requirements spec explicitly frames the frontend-only path as "pre-loaded sample feeds become the default starting state rather than a guest-specific experience." Given that, a proactive, automatic seed beats a "would you like to browse suggested feeds?" intermediate step — it gets to value fastest, and it means the app never actually looks like an empty demo shell, even on the very first paint.

**What I'd do differently:** With more time, I'd add a lightweight feed-discovery search (by topic or publication name) for people who *do* want to add their own sources beyond the starter set, rather than requiring them to already have a feed URL in hand. OPML import (a Stretch feature I didn't build) would also serve the "power user migrating from another reader" case well.

### Digest / Summary View

**The problem I was solving:** Scrolling every item chronologically doesn't answer "what's actually new since I last looked?" — especially across 19+ feeds of very different volume (Hacker News: Best publishes constantly; A List Apart barely publishes at all).

**My approach:** `/app/digest` is a separate, visit-based view: it shows unread items published or fetched since the last time the digest was opened (falling back to a 24-hour window on first use), grouped by category, capped at 6 items per category with a "See all N" link into the full category view when there's more. A "Clear digest" action marks everything currently shown as read and resets the "since" timestamp to now. It reuses the same item rows and reader pane as the main list, so opening an item from the digest behaves identically to opening it from anywhere else (marks read, supports next/previous).

**Why I chose this approach:** Visit-based (rather than fixed daily/weekly) matches how the product-definition doc describes the target user — someone who checks in once or twice a day, not on a schedule. Grouping by category and capping the count directly addresses the spec's own question ("how do you handle days with very few items vs. hundreds?") — a quiet week for AI & ML and a firehose day for Hacker News both render as a short, scannable list instead of one giant chronological dump.

**What I'd do differently:** Right now "what's notable" is purely recency within a category. A differentiator I considered but didn't build (AI-Powered Summarization) would let the digest actually rank or summarize instead of just listing — that's the natural next step here.

### Layout Customization

**The problem I was solving:** A dense list reader (Hacker News), a card/image reader (a magazine), and a reading-focused list (Instapaper) are all valid ways to scan a feed, and different users want different ones.

**My approach:** Three layouts — Compact (single-line, dot + favicon + title + time, no excerpt), Standard (favicon/source/time, title, two-line excerpt, small thumbnail if the item has an image), and Cards (a responsive grid with a 16:9 image or a favicon placeholder when there's no image). The switcher lives in the header of every item-list view and is a single global preference (not per-category), persisted in IndexedDB. When the reader pane is open in split view, the list column automatically switches to Compact regardless of the saved preference, since the narrower column doesn't have room for excerpts or cards — the saved preference comes back as soon as the reader closes.

**Why I chose this approach:** Three options matches the spec's own caution ("too few limits expression, too many overwhelms"), and covers the concrete examples in the brand kit's design inspiration (Linear/Inoreader-style density, Feedly-style cards, Instapaper-style calm reading). I made it global rather than per-category for a simpler mental model in this first pass — the acceptance criteria only requires *a* working layout system, not per-category granularity, and a global toggle is one click regardless of where you are.

**What I'd do differently:** Per-category layout (e.g., Cards for a visual-heavy Design category, Compact for a high-volume General Tech category) is a natural extension if I revisit this — the preference model already isolates `layout` in one place, so it wouldn't require restructuring.

### Other Design Choices

- **Split-pane reading, not a separate route.** Opening an item doesn't navigate to a new page — it opens a reader pane beside the list on desktop (both independently scrollable) and swaps to a full-screen reader on mobile, with the list still one tap away via Back. Selection state lives in the URL's `?item=` query param (via `router.replace`, not a full navigation), so the browser back button and shareable/refreshable URLs both work without a page reload.
- **Feed health is computed, not just stored.** A feed's status is only ever persisted as `pending` / `active` / `error`; "stale" (no successful fetch in 30+ days) is derived at render time from `lastSuccessAt`, so it can never drift out of sync with reality the way a separately-stored "stale" flag could.
- **Confirmations are inline, not modals.** Removing a feed or deleting a category turns the row's action button into an inline "Are you sure? [Confirm] [Cancel]" rather than opening a dialog, per the pattern guidance against using modals for routine actions.
- **Reduced motion and font size are explicit settings**, not just a `prefers-reduced-motion` media query — `/app/settings` lets you force both regardless of OS setting, which the accessibility guidance calls out as going beyond baseline AA.

---

## Development Journey

### Initial Approach vs. Final

I scoped this deliberately before writing any code: the technical-requirements spec offers a full-stack (Supabase + auth) path and a frontend-only (localStorage/IndexedDB, no auth) path, and the core-requirements spec is large enough that "everything" wasn't realistic for one focused session. I chose frontend-only + Core-only (no Stretch, no differentiator) up front, which shaped every decision after — most visibly, "guest mode" doesn't exist as a separate concept here, because there's no signed-up state to be a guest *instead of*.

### Decisions Reconsidered

The item-list/reader layout went through one real correction. My first pass sized the list+reader split with a hardcoded `h-[calc(100vh-57px)]` and it looked right in a normal browser — but browser-testing it with Playwright's full-page screenshots revealed the page's *scrollable* height was wildly larger than the viewport in some captures. The actual bug was a classic nested-flexbox one: an `overflow-y-auto` region several levels deep didn't have `min-h-0` on its ancestor chain, so instead of clipping and scrolling internally, it was sized to its full content. I fixed it by making the app shell a true `h-dvh` single-screen layout with `min-h-0` threaded through every flex ancestor, and switched the inner views to `h-full` instead of a hardcoded viewport calculation.

### What Surprised Me

How much of the "editorial voice" of a feed comes through in real content, not just formatting — Hacker News: Best's RSS description field is literally `Article URL: ... Comments URL: ... Points: N # Comments: N`, which is correct, real behavior for that feed and exactly the kind of "real-world inconsistency" the challenge's sample data is designed to surface, but it's a very different shape from, say, Simon Willison's full-HTML posts. Building the parser against real, live feeds (rather than fixtures) surfaced this kind of thing immediately.

### Session Breakdown

| Session | Focus | What I Accomplished |
|---------|-------|-------------------|
| 1 | Full build | Scaffolded the Next.js app on the brand-kit tokens; built feed parsing (RSS2/Atom/RDF, encoding detection, date normalization) and the `/api/feed` route; built the IndexedDB-backed store and all Core screens (dashboard, category/feed views, reader pane, feed & category management, digest, settings); built the landing page; browser-tested every flow with Playwright, found and fixed the layout bug above; wrote this README. |

---

## AI Collaboration Reflection

### How I Used AI

This solution was built with Claude Code end-to-end in a single session: reading the spec files, scoping the two big up-front decisions (tech path and feature scope) as explicit questions rather than assumptions, then implementing the data layer, parsing logic, API route, and every screen.

### What Worked Well

Treating the two spec-level forks (full-stack vs. frontend-only; how much of Core+Stretch+differentiators to attempt) as explicit questions before writing code, rather than guessing, meant the entire build afterward proceeded without a scope-driven rewrite. Verifying in an actual headless browser (not just `next build` succeeding) caught a real rendering bug — the nested-flexbox overflow issue above — that type-checking and linting had no way to catch, since both are about code correctness, not rendered layout.

### What I Learned

`next build` passing and the app actually rendering correctly are different claims. The build was clean well before the layout bug was found; only navigating the running app in a browser and inspecting computed styles surfaced it.

### Where I Pushed Back

N/A for this session in the sense of a human correcting the AI mid-stream — this README itself is the AI's account of the build. The one place I'd flag for a human reviewer to push back on if they disagree: the choice to skip deployment. I don't have (and shouldn't fabricate) hosting credentials on the user's behalf, so the live-URL requirement is left as the explicit next step in [Known Limitations](#known-limitations) rather than something faked.

---

## Differentiators

### Chosen Differentiator(s)

None, in this session — Core scope was the explicit goal (see [Development Journey](#development-journey)). If I were to add one next, **Accessibility-First Reading** is the best fit: `/app/settings` already has explicit reduced-motion and font-size controls, ARIA labeling is already threaded through feed health, read/unread state, and live-region announcements for actions like "Refresh complete" — the remaining gap is a dedicated accessibility statement page and a dyslexia-friendly font option, both incremental on what's already built.

---

## Self-Assessment

Rate your implementation honestly. This self-awareness is part of the portfolio artifact.

| Category | Rating | Notes |
|----------|--------|-------|
| **Works for real users** — Deployed, functional end-to-end | 3/5 | Fully functional locally, verified against real live feeds in a real browser; not yet deployed to a public URL. |
| **Feed parsing robustness** — Handles format variations, errors, edge cases | 4/5 | Verified against all 19 real, live feeds (RSS2, Atom, mixed encodings, HN's metadata-only description field). RDF/RSS 1.0 and the malformed-XML recovery path are implemented but not exercised against a real broken feed in testing — code-reviewed, not field-tested. |
| **Design-it-yourself features** — Quality and thoughtfulness of onboarding, digest, and layout solutions | 4/5 | All three implemented and working end-to-end; see [Design Decisions](#design-decisions) for the reasoning and acknowledged simplifications (global vs. per-category layout, no feed-discovery search). |
| **Design quality** — Typography, spacing, visual hierarchy, polish | 3/5 | Built directly on the provided brand-kit tokens with attention to hierarchy and read/unread distinction; not iterated on visually beyond the first working pass. |
| **Responsive design** — Fully functional and well-designed across devices | 4/5 | Verified at desktop (1440px) and mobile (390px) with Playwright: bottom nav, slide-over sidebar, and single-screen layout all confirmed working. Tablet breakpoints weren't separately verified. |
| **Performance** — Fast load, smooth scrolling, efficient caching | 3/5 | ETag/Last-Modified conditional requests, lazy-loaded images, and pagination (40-item pages, not virtualization) are implemented; no Lighthouse run yet since there's no deployed URL. |
| **Accessibility** — Keyboard nav, screen reader support, contrast | 3/5 | Skip link, focus-visible styling, ARIA live announcements, semantic landmarks, and reduced-motion/font-size settings are implemented; not tested with an actual screen reader. |
| **Edge case handling** — Empty states, errors, loading, large datasets | 4/5 | Verified live: invalid feed URL, duplicate feed URL, feed fetch failure, empty category, empty digest all show the intended messaging. |
| **Code quality** — Clean, maintainable, well-structured | 4/5 | Clean `next build` and `eslint` with no errors or warnings; clear separation between parsing (`lib/feed/`), storage (`lib/storage.ts`), state (`lib/store/`), and UI (`components/`, `app/`). No automated test suite. |
| **Landing page** — Compelling, communicates value, visually polished | 4/5 | Hero, 4 feature highlights, single CTA per the frontend-only spec variant, responsive — verified in browser. |
| **Guest experience** — Immediately impressive, real content, full features | N/A | No guest-vs-signed-up distinction exists in the frontend-only path — see [Overview](#overview). The equivalent property (first-visit dashboard populated with real content) is covered under Onboarding above. |

### Lighthouse Scores

Not yet run — the app isn't deployed to a public URL yet (Lighthouse needs one). Fill in after deploying:

| Category | Score |
|----------|-------|
| Performance | — |
| Accessibility | — |
| Best Practices | — |
| SEO | — |

### Strengths

The feed parsing layer is the part I'm most confident in: it's normalizing three different XML shapes (RSS 2.0, Atom, RSS 1.0/RDF), handling encoding detection from both HTTP headers and the XML declaration, and has a genuine fallback path for malformed XML (regex-extracting individual `<item>`/`<entry>` blocks when the document as a whole won't parse) — and all of it was verified against 19 real, live feeds rather than synthetic fixtures.

### Areas for Improvement

The biggest gap against the full spec is the Stretch tier — bookmarks, search, OPML import/export, and keyboard navigation are all unbuilt. Of those, OPML import is the one I'd prioritize first, since `data/sample-feeds.opml`'s edge cases (duplicate URLs, missing attributes, lowercase attribute names) are exactly the kind of parsing robustness this build already invests in elsewhere.

---

## Known Limitations

- **Not deployed.** This needs a live URL to satisfy the challenge's submission requirements; deploying to Vercel/Netlify is the immediate next step (`npm run build && npm run start` works locally as a production build today).
- **No Stretch features.** Bookmarks, search, OPML import/export, configurable auto-refresh beyond a fixed interval picker, and keyboard navigation are all out of scope for this session (see [Development Journey](#development-journey) for why).
- **No differentiator.** See [Differentiators](#differentiators).
- **Pagination, not virtualization.** Long lists load 40 items at a time via a "Load more" button rather than a virtualized scroller — fine at the scale this app operates at (hundreds of items per feed, capped at 300 stored per feed), but not true windowing.
- **Redirect handling is best-effort.** The Fetch API doesn't expose per-hop status codes, so a permanent (301) vs. temporary (302) redirect can't be distinguished — any followed redirect updates the stored feed URL, which is usually but not always the right call.
- **Rate limiting is per-instance and in-memory.** It resets on a cold start and wouldn't coordinate across multiple serverless instances in a scaled deployment — acceptable for a single-user app, called out here for honesty.
- **No automated tests.** Correctness was verified through a real build (`next build`, `eslint`) and manual/scripted browser testing (Playwright) against the running app, not a committed test suite.
- **Single browser, single device.** By design of the frontend-only path — there's no account, so feeds/categories/read-state live only in the browser that added them, with no cross-device sync.

---

## Running Locally

```bash
# Clone the repo
git clone [your-repo-url]
cd frontpage

# Use Node 20+ (see .nvmrc)
nvm use

# Install dependencies
npm install

# Run the development server
npm run dev
```

Then open `http://localhost:3000`. There are no environment variables to configure — this is the frontend-only path, so there's no database or auth provider to connect.

### Environment Variables

None. Everything runs client-side against IndexedDB, with feed fetching handled by this app's own `/api/feed` route.

---

## Acknowledgments

Built as a [Frontend Mentor Product Challenge](https://www.frontendmentor.io).
