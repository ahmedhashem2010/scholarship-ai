import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - ScholarshipAI",
  description: "How ScholarshipAI collects, uses, and protects your personal data.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
