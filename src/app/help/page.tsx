"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How does the matching algorithm work?",
        a: "Our algorithm analyzes your profile (education, major, country, English level, age) and compares it against each scholarship's requirements. It calculates a Fit Score from 0-100 based on how well you match. Scores above 70% mean you're a strong candidate.",
      },
      {
        q: "How do I create a strong profile?",
        a: "Fill out every field in the onboarding form accurately. Include your exact major, education level, and English proficiency. The more accurate your profile, the better your matches will be. You can always update your profile from the dashboard settings.",
      },
      {
        q: "How many scholarships should I apply to?",
        a: "We recommend applying to 2-4 scholarships. Focus on 1-2 where your fit score is 80%+, and 1-2 where you meet all requirements. Quality beats quantity — a strong application to fewer scholarships is better than weak applications to many.",
      },
    ],
  },
  {
    category: "Documents",
    items: [
      {
        q: "What makes a good personal statement?",
        a: "A strong personal statement tells YOUR story. Start with a specific achievement or moment that sparked your passion. Show measurable impact (use numbers). Connect your experience clearly to why THIS program is your next step. End with your future goals.",
      },
      {
        q: "How do I improve my AI score?",
        a: "Upload a draft, get AI feedback, then revise and upload again. Each iteration typically improves your score by 1-2 points. Focus on the specific problems identified in your review — weak openings, vague achievements, unclear connections to the program.",
      },
      {
        q: "Can I reuse documents for different scholarships?",
        a: "Yes, but always customize! Your CV/resume can be mostly reused. Your personal statement should be tailored to each scholarship's requirements and values. Start from your best draft and adjust the focus, examples, and goals.",
      },
      {
        q: "How many drafts should I upload?",
        a: "Most students reach a strong document (score 8+) in 2-3 drafts. Upload your first draft for baseline feedback, revise based on suggestions, then upload again. We find the biggest jump happens between draft 1 and 2.",
      },
    ],
  },
  {
    category: "Applications",
    items: [
      {
        q: "What's the application timeline?",
        a: "We recommend: 8-12 weeks before deadline — start researching and preparing documents. 6-8 weeks — first drafts of all documents. 4-6 weeks — AI reviews and revisions. 2-4 weeks — final polish and review. 1 week — submit!",
      },
      {
        q: "How do I track multiple applications?",
        a: "Your dashboard shows all active applications with progress bars. The Compare tool lets you compare up to 4 scholarships side by side. Each application has its own journey page with document checklist and timeline.",
      },
      {
        q: "When should I start applying?",
        a: "Start as early as possible! Most scholarships have deadlines 6-12 months before the program starts. Use the deadline indicators on your dashboard to prioritize — red means urgent (under 15 days), yellow means soon (15-30 days).",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        q: "How do I upload documents?",
        a: "Go to the Documents page and click 'Upload Document'. Select a file from your computer (PDF or DOCX, max 10MB). Choose the document type (Personal Statement, CV, etc.) and click upload. You can also upload from the Application Journey page.",
      },
      {
        q: "What file formats are supported?",
        a: "We support PDF (.pdf) and Word documents (.docx). PDF is preferred as it preserves formatting. Maximum file size is 10MB. Scanned PDFs (image-based) may not work with our AI text extraction.",
      },
      {
        q: "How do I contact support?",
        a: "Use the AI chat widget (bottom-right corner) for instant answers to common questions. For technical issues, reach out via the support email in your account settings. We typically respond within 24 hours.",
      },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const filtered = faqs.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  function toggle(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="page-container py-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="h-4 w-4 text-white/80" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Help Center</span>
          </div>
          <h1 className="text-h2 sm:text-h1 mt-2">Frequently Asked Questions</h1>
          <p className="mt-2 text-white/80">Everything you need to know about using ScholarshipAI</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-8">
        {filtered.map((cat) => (
          <section key={cat.category}>
            <h2 className="text-h3 mb-4">{cat.category}</h2>
            <div className="space-y-2">
              {cat.items.map((item, i) => {
                const key = `${cat.category}-${i}`;
                const isOpen = openItems.has(key);
                return (
                  <div key={key} className="rounded-xl border bg-white overflow-hidden transition-all">
                    <button
                      onClick={() => toggle(key)}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground pr-4">{item.q}</span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No results found</h2>
          <p className="text-muted-foreground text-sm mt-1">Try different search terms</p>
        </div>
      )}
    </div>
  );
}
