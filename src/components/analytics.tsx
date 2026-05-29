"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window { dataLayer?: unknown[] }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined") return;

    if (!document.querySelector(`script[src*="googletagmanager"]`)) {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      script.async = true;
      document.head.appendChild(script);

      const gtag = (...args: unknown[]) => (window.dataLayer ?? []).push(args);
      gtag("js", new Date());
      gtag("config", GA_ID);
    }
  }, []);

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined") return;
    const gtag = (...args: unknown[]) => (window.dataLayer ?? []).push(args);
    gtag("event", "page_view", {
      page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}
