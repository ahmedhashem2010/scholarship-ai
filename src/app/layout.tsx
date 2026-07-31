import type { Metadata } from "next";
import "./globals.css";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { HeroUIProvider } from "@/components/hero-ui-provider";
import dynamic from "next/dynamic";
import { Analytics } from "@/components/analytics";
import { ProfileProvider } from "@/lib/profile-context";
import { CreditsProvider } from "@/lib/credits-context";
import { BRAND, SEO, pageTitle } from "@/lib/brand";

const ChatWidget = dynamic(() => import("@/components/chat-widget").then((m) => m.ChatWidget), {
  ssr: false,
  loading: () => null,
});

// One type system for both scripts.
//
// IBM Plex Sans and IBM Plex Sans Arabic were drawn together, so they share
// stroke weight, x-height and rhythm. That matters more than it sounds: this
// is the fourth Arabic font this project has used, and the previous three all
// failed the same way — an Arabic face and a Latin face picked separately
// never sit on a line properly, and every fix breaks something else.
//
// The comment here already claimed Plex while the code actually loaded Plus
// Jakarta Sans, which is its own lesson about trusting comments.
const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const fontArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SEO.siteUrl),
  title: {
    default: pageTitle(),
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  openGraph: {
    // Arabic title and description, because the link is going into Arabic
    // Facebook groups and Telegram channels. Meta tags are plain UTF-8 — the
    // platform shapes the text, so Arabic renders correctly here even though
    // it can't be baked into the PNG.
    title: `${BRAND.nameAr} — ${BRAND.taglineAr}`,
    description: BRAND.descriptionAr,
    siteName: BRAND.name,
    url: SEO.siteUrl,
    locale: SEO.locale,
    alternateLocale: SEO.alternateLocale,
    type: "website",
    images: [
      {
        // `summary_large_image` without an image renders as a grey box, which
        // is worse than no card at all. In a feed the preview IS the ad.
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${BRAND.name} — ${BRAND.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.nameAr} — ${BRAND.taglineAr}`,
    description: BRAND.descriptionAr,
    images: ["/og.png"],
  },
  alternates: {
    canonical: SEO.siteUrl,
    languages: { ar: SEO.siteUrl, en: SEO.siteUrl },
  },
  // The tab icon is a separate file from the mark, deliberately. At 16px the
  // lane dashes are under a pixel wide and grey the road into a smudge, so
  // favicon.svg drops them and enlarges the nodes. Same geometry, different
  // detail budget — both generated from one source by scripts/build-brand.mjs.
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/brand/app-icon.svg", type: "image/svg+xml" }],
  },
  // Navy in both modes. The browser paints this behind the address bar on
  // mobile before the page renders, so a mismatched value shows as a flash of
  // the wrong colour on every navigation.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#162C4C" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1A2D" },
  ],
  keywords: [
    "منح دراسية", "منح ممولة بالكامل", "الدراسة في الخارج", "منح للطلاب العرب",
    "scholarships for Arab students", "fully funded scholarships",
    "study abroad Egypt", "IELTS waiver scholarships",
  ],
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cn("font-sans", fontSans.variable, fontArabic.variable)}
    >
      <head>
        {/*
          Applies the saved language before first paint. Without this the page
          renders Arabic/RTL for a beat and then snaps to English for anyone who
          chose English — a visible, ugly flash on every navigation.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem("smartscholar.lang");if(l==="en"||l==="ar"){document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";document.documentElement.dataset.lang=l;}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:outline-none focus:start-4"
        >
          Skip to main content
        </a>
        <HeroUIProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <LanguageProvider>
              <ProfileProvider>
                <CreditsProvider>
                  <div className="min-h-screen bg-background">
                    <main id="main-content" className="flex-1 min-w-0">
                      {children}
                    </main>
                  </div>
                  <ChatWidget />
                  <Analytics />
                </CreditsProvider>
              </ProfileProvider>
            </LanguageProvider>
          </ThemeProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
