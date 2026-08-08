import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service - SmartScholar",
  description: "Terms and conditions for using the SmartScholar platform.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-h2 font-bold text-foreground mb-8">Terms of Service</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p><strong>Last updated:</strong> May 2026</p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">1. Acceptance of Terms</h2>
        <p>By using {BRAND.name}, you agree to these terms. If you do not agree, do not use the service.</p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">2. Description of Service</h2>
        <p>{BRAND.name} provides free AI-powered scholarship matching, document review, and application roadmaps for students. All core features are free to use; document reviews are subject to a daily limit.</p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">3. User Responsibilities</h2>
        <p>You are responsible for providing accurate information and ensuring your use of the platform complies with all applicable laws. You may not upload malicious content or attempt to abuse the AI review system.</p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">4. AI Reviews</h2>
        <p>AI-generated feedback is provided as guidance only and does not guarantee scholarship acceptance. Reviews are based on patterns and best practices, not on actual admissions criteria.</p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">5. Limitation of Liability</h2>
        <p>{BRAND.name} is not responsible for scholarship application outcomes. The platform provides tools and guidance but does not guarantee admission or funding.</p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">6. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use after changes constitutes acceptance of the new terms.</p>
      </div>
    </main>
  );
}
