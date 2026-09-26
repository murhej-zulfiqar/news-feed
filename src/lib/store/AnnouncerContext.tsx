"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const parity = useRef(0);

  const announce = useCallback<Announce>((msg: string) => {
    parity.current += 1;
    // Append a zero-width space on alternating calls so identical
    // consecutive messages still register as a text change for AT.
    setMessage(parity.current % 2 === 0 ? `${msg}​` : msg);
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div aria-live="polite" role="status" className="sr-only">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce(): Announce {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) throw new Error("useAnnounce must be used within an AnnouncerProvider");
  return ctx;
}
