'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, TrendingUp, Award, Star, Sparkles } from "lucide-react";

const stories = [
  {
    name: "Ahmed",
    country: "Egypt",
    scholarship: "MEXT Scholarship (Japan)",
    initialScore: 6,
    finalScore: 8.5,
    drafts: 3,
    accepted: true,
    quote: "The AI feedback helped me see weaknesses I couldn't spot myself. Each review pointed out specific things to fix, and my score went up every time.",
    improvements: ["Personal statement opening was too generic", "CV lacked quantified achievements", "Research proposal scope was too broad"],
  },
  {
    name: "Layla",
    country: "Saudi Arabia",
    scholarship: "Stipendium Hungaricum (Hungary)",
    initialScore: 5.5,
    finalScore: 9,
    drafts: 4,
    accepted: true,
    quote: "I was going to submit my first draft, but the AI caught grammar issues I'd missed completely. The coaching-style feedback made improvement feel achievable.",
    improvements: ["Motivation letter needed stronger conclusion", "English level was below requirement — improved through practice"],
  },
  {
    name: "Omar",
    country: "Jordan",
    scholarship: "Chevening Scholarship (UK)",
    initialScore: 7,
    finalScore: 9.5,
    drafts: 2,
    accepted: true,
    quote: "The matching algorithm showed me scholarships I hadn't considered. My best match wasn't the one I thought — and I got accepted!",
    improvements: ["Leadership examples needed more impact", "Work experience section was too long"],
  },
  {
    name: "Mariam",
    country: "UAE",
    scholarship: "DAAD Scholarship (Germany)",
    initialScore: 4,
    finalScore: 7.5,
    drafts: 5,
    accepted: true,
    quote: "I started with a very weak draft and almost gave up. The step-by-step checklist in each review made it manageable. Five drafts later, I had a document I was proud of.",
    improvements: ["Research proposal needed methodology section", "Grammar issues throughout", "Personal statement lacked direction"],
  },
  {
    name: "Youssef",
    country: "Morocco",
    scholarship: "Eiffel Excellence (France)",
    initialScore: 6.5,
    finalScore: 8,
    drafts: 3,
    accepted: false,
    quote: "I didn't get the scholarship, but the platform prepared me well for the next application. My documents are now submission-ready for any similar opportunity.",
    improvements: ["French language section needed more detail", "Academic achievements needed better presentation"],
  },
];

function getImprovementEmoji(initial: number, final: number): string {
  const diff = final - initial;
  if (diff >= 3) return "🔥";
  if (diff >= 2) return "📈";
  return "👍";
}

export default function SuccessStoriesPage() {
  return (
    <div className="page-container py-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Real Results</span>
          </div>
          <h1 className="text-h2 sm:text-h1 mt-2">Success Stories</h1>
          <p className="mt-2 text-white/80 max-w-2xl">
            Real students who improved their applications and achieved their scholarship goals
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story, i) => (
          <Card key={i} className="flex flex-col card-hover">
            <CardHeader>
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary text-sm font-bold">
                    {story.name[0]}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{story.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{story.country}</p>
                  </div>
                </div>
                {story.accepted ? (
                  <Badge variant="green" className="text-[10px]">Accepted</Badge>
                ) : (
                  <Badge variant="yellow" className="text-[10px]">In Progress</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{story.scholarship}</p>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Score:</span>
                  <span className="text-sm font-bold text-danger">{story.initialScore}</span>
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  <span className="text-sm font-bold text-success">{story.finalScore}</span>
                </div>
                <span className="text-xs text-muted-foreground">· {story.drafts} drafts</span>
                <span className="text-sm">{getImprovementEmoji(story.initialScore, story.finalScore)}</span>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 relative">
                <Quote className="h-3 w-3 text-muted-foreground absolute top-2 left-2" />
                <p className="text-xs text-muted-foreground italic pl-4">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Key Improvements
                </p>
                <ul className="space-y-1">
                  {story.improvements.map((imp, j) => (
                    <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-success mt-0.5">•</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
        <Award className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Your success story starts here</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Start your application journey today. With AI-powered feedback and personalized matching,
          you&apos;re already one step closer to your scholarship.
        </p>
      </div>
    </div>
  );
}
