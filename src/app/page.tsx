import Link from "next/link";
import { BookOpen, FolderKanban, Gauge, Rss } from "lucide-react";

const FEATURES = [
  {
    icon: Rss,
    title: "Real RSS & Atom parsing",
    description:
      "Handles RSS 2.0, Atom, and RSS 1.0/RDF feeds — with all the encoding quirks, missing fields, and malformed XML real feeds throw at you.",
  },
  {
    icon: FolderKanban,
    title: "Categories that fit how you read",
    description: "Group feeds into your own categories, see unread counts at a glance, and drill into any one of them.",
  },
  {
    icon: BookOpen,
    title: "A calm reading view",
    description:
      "Full articles render cleanly — headings, code blocks, images — stripped of ads and clutter, right inside the app.",
  },
  {
    icon: Gauge,
    title: "A digest, not a firehose",
    description: "Check in once a day and see what's new since last time, grouped by category — not everything, chronologically.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="border-b border-(--color-border)">
        <div className="mx-auto flex max-w-page items-center justify-between px-4 py-4 md:px-6">
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-(--radius-md) bg-(--color-accent) text-sm font-bold text-white">
              F
            </span>
            <span className="text-lg font-semibold tracking-tight">Frontpage</span>
          </span>
          <Link
            href="/app"
            className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-page px-4 py-16 text-center md:px-6 md:py-24">
          <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-(--color-text-primary) md:text-(length:--text-3xl)">
            Your personalized front page for tech content.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-(--color-text-secondary) md:text-lg">
            Frontpage pulls RSS and Atom feeds from the blogs, newsletters, and publications you follow into one
            clean, well-organized reading dashboard. Your sources, your categories, your pace.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/app"
              className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-6 py-3 text-base font-semibold text-white hover:bg-(--color-accent-hover)"
            >
              Open Dashboard — it&apos;s pre-loaded with 19 feeds
            </Link>
          </div>
          <p className="mt-3 text-sm text-(--color-text-tertiary)">
            No sign-up. Everything lives in your browser — add your own feeds any time.
          </p>
        </section>

        <section className="border-t border-(--color-border) bg-(--color-bg-secondary)">
          <div className="mx-auto grid max-w-page grid-cols-1 gap-6 px-4 py-14 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-(--radius-md) bg-(--color-accent-subtle) text-(--color-accent)">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="mt-1.5 text-sm text-(--color-text-secondary)">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-(--color-border) px-4 py-8 text-center text-sm text-(--color-text-tertiary) md:px-6">
        Built as a{" "}
        <a
          href="https://www.frontendmentor.io"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-(--color-text-secondary)"
        >
          Frontend Mentor
        </a>{" "}
        Product Challenge.
      </footer>
    </div>
  );
}
