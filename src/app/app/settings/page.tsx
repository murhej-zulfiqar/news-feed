"use client";

import { useState } from "react";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import type { FontScale } from "@/lib/types";

const REFRESH_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Manual only", value: null },
  { label: "Every 15 minutes", value: 15 },
  { label: "Every 30 minutes", value: 30 },
  { label: "Every hour", value: 60 },
];

const FONT_OPTIONS: { label: string; value: FontScale }[] = [
  { label: "Small", value: "sm" },
  { label: "Medium (default)", value: "md" },
  { label: "Large", value: "lg" },
];

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-(--radius-lg) border border-(--color-border) p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-(--color-text-secondary)">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { preferences, setAutoRefreshMinutes, setReducedMotion, setFontScale } = useFeedStore();
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="mx-auto flex max-w-content flex-col gap-6 px-4 py-6 md:px-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Frontpage stores everything in this browser — there&apos;s no account, so these preferences and your feeds
          live only on this device.
        </p>
      </div>

      <SettingsSection
        title="Auto-refresh"
        description="Automatically check all feeds for new items on an interval. Refresh is always non-blocking — you can keep reading while it runs."
      >
        <div role="radiogroup" aria-label="Auto-refresh interval" className="flex flex-wrap gap-2">
          {REFRESH_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              role="radio"
              aria-checked={preferences.autoRefreshMinutes === opt.value}
              onClick={() => setAutoRefreshMinutes(opt.value)}
              className={`focus-ring rounded-(--radius-md) border px-3 py-1.5 text-sm ${
                preferences.autoRefreshMinutes === opt.value
                  ? "border-(--color-accent) bg-(--color-accent-subtle) text-(--color-accent)"
                  : "border-(--color-border) hover:bg-(--color-bg-tertiary)"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Reading comfort" description="Beyond WCAG AA basics — tune the app to how you read.">
        <div className="flex flex-col gap-4">
          <div>
            <span className="mb-1.5 block text-sm font-medium">Font size</span>
            <div role="radiogroup" aria-label="Font size" className="flex flex-wrap gap-2">
              {FONT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={preferences.fontScale === opt.value}
                  onClick={() => setFontScale(opt.value)}
                  className={`focus-ring rounded-(--radius-md) border px-3 py-1.5 text-sm ${
                    preferences.fontScale === opt.value
                      ? "border-(--color-accent) bg-(--color-accent-subtle) text-(--color-accent)"
                      : "border-(--color-border) hover:bg-(--color-bg-tertiary)"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="focus-ring h-4 w-4 rounded-(--radius-sm)"
            />
            Reduce motion (disables all non-essential animation, regardless of your OS setting)
          </label>
        </div>
      </SettingsSection>

      <SettingsSection title="Data" description="Everything Frontpage stores lives in this browser's IndexedDB.">
        {confirmingReset ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-(--color-text-secondary)">
              This removes every feed, category, and read/bookmark state on this device. This can&apos;t be undone.
            </span>
            <button
              onClick={() => {
                indexedDB.deleteDatabase("frontpage-db");
                window.localStorage.clear();
                // Intentional hard reload: a full reset needs a fresh JS
                // context, not a client-side route transition.
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = "/app";
              }}
              className="focus-ring rounded-(--radius-md) bg-(--color-error) px-3 py-1.5 font-medium text-white hover:opacity-90"
            >
              Reset everything
            </button>
            <button
              onClick={() => setConfirmingReset(false)}
              className="focus-ring rounded-(--radius-md) border border-(--color-border) px-3 py-1.5 hover:bg-(--color-bg-tertiary)"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingReset(true)}
            className="focus-ring rounded-(--radius-md) border border-(--color-border) px-3 py-1.5 text-sm hover:bg-(--color-bg-tertiary)"
          >
            Reset all data
          </button>
        )}
      </SettingsSection>
    </div>
  );
}
