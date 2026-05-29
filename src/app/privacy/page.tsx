import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - ScholarshipAI",
  description: "How ScholarshipAI collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-h2 font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-sm text-gray-600 leading-relaxed">
        <p><strong>Last updated:</strong> May 2026</p>

        <h2 className="text-h4 font-semibold text-gray-900 mt-8">1. Information We Collect</h2>
        <p>We collect information you provide when creating an account, uploading documents, and using our AI review services. This includes your name, email address, educational background, and document content.</p>

        <h2 className="text-h4 font-semibold text-gray-900 mt-8">2. How We Use Your Information</h2>
        <p>Your information is used to provide scholarship matching, AI document reviews, and personalized recommendations. Document content is sent to our AI provider (AgentRouter/Claude) solely for the purpose of generating feedback.</p>

        <h2 className="text-h4 font-semibold text-gray-900 mt-8">3. Data Storage & Security</h2>
        <p>Your data is stored securely using Supabase infrastructure. We implement industry-standard security measures including encryption in transit and at rest.</p>

        <h2 className="text-h4 font-semibold text-gray-900 mt-8">4. Third-Party Services</h2>
        <p>We use Supabase for authentication and storage, and AgentRouter/Anthropic Claude for AI-powered document reviews. These services have their own privacy policies governing data handling.</p>

        <h2 className="text-h4 font-semibold text-gray-900 mt-8">5. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data at any time. Contact us to exercise these rights.</p>

        <h2 className="text-h4 font-semibold text-gray-900 mt-8">6. Contact</h2>
        <p>For privacy-related inquiries, please contact us through our support channels.</p>
      </div>
    </main>
  );
}
