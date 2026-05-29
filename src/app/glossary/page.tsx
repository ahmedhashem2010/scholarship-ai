import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search } from "lucide-react";

const terms = [
  {
    category: "Academics & Grades",
    items: [
      {
        term: "GPA (Grade Point Average)",
        definition: "A standardized measure of academic performance. Usually on a 4.0 scale in the US system. Many scholarships require a minimum GPA (e.g., 3.0/4.0).",
      },
      {
        term: "CGPA (Cumulative GPA)",
        definition: "Your overall GPA across all semesters/years of study. Some scholarships look at CGPA rather than semester-by-semester grades.",
      },
      {
        term: "ECTS (European Credit Transfer System)",
        definition: "A standard used by European universities to measure academic workload. 60 ECTS = 1 full academic year. Used by scholarships like Stipendium Hungaricum and Erasmus.",
      },
    ],
  },
  {
    category: "Language Tests",
    items: [
      {
        term: "TOEFL (Test of English as a Foreign Language)",
        definition: "An English proficiency test accepted by most universities worldwide. Common required scores: 80-100 (internet-based). Valid for 2 years.",
      },
      {
        term: "IELTS (International English Language Testing System)",
        definition: "Another widely accepted English test. Scores are on a 1-9 band scale. Most scholarships require 6.0-7.0. Academic version is usually required.",
      },
      {
        term: "JLPT (Japanese Language Proficiency Test)",
        definition: "A test of Japanese language ability (N1-N5, where N1 is highest). Required for some Japanese scholarships like MEXT if the program is taught in Japanese.",
      },
    ],
  },
  {
    category: "Documents",
    items: [
      {
        term: "Recommendation Letter",
        definition: "A letter from a professor, employer, or mentor supporting your application. Choose someone who knows your work well. Give them 2-3 weeks to write it.",
      },
      {
        term: "Research Proposal",
        definition: "A detailed plan of your intended research project. Required for research-based scholarships (MEXT, DAAD). Should include: title, background, methodology, timeline, expected outcomes.",
      },
      {
        term: "Motivation Letter / Personal Statement",
        definition: "An essay explaining why you want this scholarship and why you're a good fit. Focus on your story, achievements, and future goals. Typically 500-1000 words.",
      },
    ],
  },
  {
    category: "Scholarship Terms",
    items: [
      {
        term: "Stipend",
        definition: "A regular payment (monthly or yearly) to cover living expenses while studying. Amounts vary by country and scholarship program.",
      },
      {
        term: "Tuition Waiver",
        definition: "A reduction or elimination of tuition fees. Full tuition waiver means you pay nothing for courses. Most competitive scholarships include this.",
      },
      {
        term: "Full Scholarship",
        definition: "Covers all major expenses: tuition, living costs, accommodation, health insurance, and sometimes travel. Examples: MEXT, Chevening, Stipendium Hungaricum.",
      },
      {
        term: "Bond / Service Requirement",
        definition: "A commitment to return to your home country or work for a specific employer after graduation. Some scholarships require this (e.g., return to Egypt for 2 years after MEXT).",
      },
    ],
  },
];

export default function GlossaryPage() {
  return (
    <div className="page-container py-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-white/80" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Reference</span>
          </div>
          <h1 className="text-h2 sm:text-h1 mt-2">Scholarship Glossary</h1>
          <p className="mt-2 text-white/80 max-w-2xl">
            Common terms and abbreviations used in scholarship applications
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {terms.map((cat) => (
          <section key={cat.category}>
            <h2 className="text-h3 mb-4">{cat.category}</h2>
            <div className="space-y-3">
              {cat.items.map((item, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-sm">{item.term}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.definition}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
        <Search className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <h2 className="text-base font-semibold text-foreground mb-1">Can&apos;t find a term?</h2>
        <p className="text-sm text-muted-foreground">
          Ask our AI assistant using the chat widget — it can explain any scholarship term on the spot.
        </p>
      </div>
    </div>
  );
}
