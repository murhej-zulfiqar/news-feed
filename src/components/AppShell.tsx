"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FolderKanban, Inbox, Menu, RefreshCw, Rss, Sparkles, X } from "lucide-react";
import { SidebarContent } from "./Sidebar";
import { useFeedStore } from "@/lib/store/FeedStoreContext";
import { useAnnounce } from "@/lib/store/AnnouncerContext";

function MobileNavLink({ href, active, icon: Icon, label }: { href: string; active: boolean; icon: typeof Inbox; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`focus-ring flex min-w-11 flex-1 flex-col items-center gap-0.5 rounded-(--radius-md) py-2 text-[11px] ${
        active ? "text-(--color-accent)" : "text-(--color-text-tertiary)"
      }`}
    >
      <Icon size={20} aria-hidden="true" />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { isRefreshingAll, refreshAll, isHydrated, preferences } = useFeedStore();
  const announce = useAnnounce();

  useEffect(() => {
    document.documentElement.setAttribute("data-reduced-motion", String(preferences.reducedMotion));
    document.documentElement.setAttribute("data-font-scale", preferences.fontScale);
  }, [preferences.reducedMotion, preferences.fontScale]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <aside className="hidden w-sidebar shrink-0 overflow-y-auto border-r border-(--color-border) bg-(--color-bg-secondary) md:block">
        <SidebarContent />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 w-[85vw] max-w-sidebar bg-(--color-bg-secondary) shadow-(--shadow-lg)"
          >
            <div className="flex justify-end p-2">
              <button
                onClick={() => setMobileNavOpen(false)}
                className="focus-ring rounded-(--radius-md) p-2 text-(--color-text-secondary)"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-(--color-border) bg-(--color-bg-primary) px-4 py-3 md:px-6">
          <button
            className="focus-ring rounded-(--radius-md) p-2 text-(--color-text-secondary) md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await refreshAll();
                announce("Refresh complete.");
              }}
              disabled={!isHydrated || isRefreshingAll}
              className="focus-ring flex items-center gap-2 rounded-(--radius-md) border border-(--color-border) px-3 py-1.5 text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-bg-tertiary) disabled:opacity-50"
            >
              <RefreshCw size={16} aria-hidden="true" className={isRefreshingAll ? "animate-spin" : undefined} />
              <span className="hidden sm:inline">{isRefreshingAll ? "Refreshing…" : "Refresh all"}</span>
            </button>
            <Link
              href="/app/feeds"
              className="focus-ring rounded-(--radius-md) bg-(--color-accent) px-3 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              + Add feed
            </Link>
          </div>
        </header>

        <main id="main-content" className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-(--color-border) bg-(--color-bg-primary) px-1 py-1 md:hidden"
        >
          <MobileNavLink href="/app" active={pathname === "/app"} icon={Inbox} label="All Items" />
          <MobileNavLink href="/app/digest" active={pathname === "/app/digest"} icon={Sparkles} label="Digest" />
          <MobileNavLink href="/app/feeds" active={pathname === "/app/feeds"} icon={Rss} label="Feeds" />
          <MobileNavLink
            href="/app/categories"
            active={pathname === "/app/categories"}
            icon={FolderKanban}
            label="Categories"
          />
        </nav>
      </div>
    </div>
  );
}
