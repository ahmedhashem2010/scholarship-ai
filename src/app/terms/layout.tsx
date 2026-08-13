import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - SmartScholar",
  description: "Terms and conditions for using the SmartScholar platform.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
