"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";

type CreditsState = {
  credits: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const CreditsContext = createContext<CreditsState | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  async function fetchCredits() {
    try {
      const res = await fetch("/api/user/credits");
      const json = await res.json();
      if (json.credits !== undefined) setCredits(json.credits);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchCredits();
  }, []);

  return (
    <CreditsContext.Provider value={{ credits, isLoading, refresh: fetchCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error("useCredits must be used within CreditsProvider");
  return ctx;
}
