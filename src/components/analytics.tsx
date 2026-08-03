"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Fires a GA4 page_view on client-side route changes.
 *
 * The `GoogleAnalytics` component from @next/third-parties only issues
 * `gtag('config')` on first load — it does NOT observe the router, so App
 * Router navigations would otherwise never be counted. This effect sends a
 * page_view only for navigations AFTER the initial config (which already
 * counted the first page), avoiding a double count on first paint.
 */
function usePageViewTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!GA_ID || typeof window === "undefined") return;

    const pagePath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    (window.dataLayer ?? []).push(["event", "page_view", { page_path: pagePath }]);
  }, [pathname, searchParams]);
}

function AnalyticsInner() {
  usePageViewTracking();

  return (
    <>
      {IS_PRODUCTION && GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      {IS_PRODUCTION ? (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);
    t.async=1;
    t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "xwt71nc9d4");
`}
        </Script>
      ) : null}
    </>
  );
}

export function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}
