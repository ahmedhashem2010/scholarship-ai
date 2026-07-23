import type { Metadata } from "next";
import "./globals.css";
import { Inter, Poppins, Tajawal } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { HeroUIProvider } from "@/components/hero-ui-provider";
import dynamic from "next/dynamic";
import { Analytics } from "@/components/analytics";
import { ProfileProvider } from "@/lib/profile-context";
import { CreditsProvider } from "@/lib/credits-context";

const ChatWidget = dynamic(() => import("@/components/chat-widget").then((m) => m.ChatWidget), {
  ssr: false,
  loading: () => null,
});

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontPoppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-poppins" });
const fontArabic = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "ScholarshipAI - Smart Scholarship Platform",
  description: "AI-powered platform to help Arab students find and apply for scholarships",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={cn("font-sans", fontSans.variable, fontPoppins.variable, fontArabic.variable)}>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:outline-none"
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
