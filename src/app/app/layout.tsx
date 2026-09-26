import type { ReactNode } from "react";
import { FeedStoreProvider } from "@/lib/store/FeedStoreContext";
import { AnnouncerProvider } from "@/lib/store/AnnouncerContext";
import { AppShell } from "@/components/AppShell";

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <FeedStoreProvider>
      <AnnouncerProvider>
        <AppShell>{children}</AppShell>
      </AnnouncerProvider>
    </FeedStoreProvider>
  );
}
