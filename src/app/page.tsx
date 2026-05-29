export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight, Check, Brain, Target, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/scholarship/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">ScholarshipAI</div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/auth/signup"
              className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
            Find Your Perfect
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Scholarship in Minutes
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop spending hours searching scattered websites.
            Get scholarships matched to YOUR profile with AI coaching for your application.
          </p>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap justify-center gap-8 pt-4 text-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">91%</div>
              <div className="text-gray-600 dark:text-gray-400">Interested in AI help</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">44</div>
              <div className="text-gray-600 dark:text-gray-400">Students surveyed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">$0</div>
              <div className="text-gray-600 dark:text-gray-400">To get started</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/auth/signup"
              className="bg-blue-600 dark:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition flex items-center justify-center gap-2"
            >
              Start Finding Scholarships
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 dark:hover:border-gray-500 transition">
              Watch Demo (Soon)
            </button>
          </div>

          {/* Trust Message */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ✓ No credit card required • ✓ Free forever • ✓ Built by a student like you
          </p>
        </div>

        {/* Hero Dashboard Preview Mockup */}
        <div className="max-w-4xl mx-auto mt-16 px-4">
          <div className="bg-gradient-to-b from-blue-100 to-white dark:from-blue-900/30 dark:to-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-blue-200 dark:border-blue-900/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Browser top bar */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white dark:bg-gray-700 text-[10px] text-gray-400 border border-gray-200 dark:border-gray-600">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  scholarshipai.app/dashboard
                </div>
                <div className="w-14" />
              </div>

              {/* Dashboard content */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Welcome Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Welcome back, Ahmed!</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your top scholarships are ready</p>
                  </div>
                  <div className="h-8 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center">
                    Browse All
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Active Scholarships</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">12</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Documents Ready</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400 mt-0.5">4</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Avg Score</div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">7.2</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Deadlines Soon</div>
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-0.5">3</div>
                  </div>
                </div>

                {/* Scholarship Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Card 1 */}
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-lg">🇯🇵</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">MEXT Scholarship</span>
                          <span className="shrink-0 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/50 px-2 py-0.5 rounded-full">92% match</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Japan · Bachelor</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 dark:text-gray-400">Match Score</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">92%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: "92%" }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>📅 Dec 15, 2026</span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">45d left</span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-lg">🇬🇧</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">Chevening Award</span>
                          <span className="shrink-0 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/50 px-2 py-0.5 rounded-full">78% match</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">United Kingdom · Master</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 dark:text-gray-400">Match Score</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">78%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: "78%" }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>📅 Feb 28, 2027</span>
                      <span className="font-medium text-gray-500">120d left</span>
                    </div>
                  </div>
                </div>

                {/* Bottom hint */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    Showing 2 of 12 matched scholarships
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">View all →</div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
              Dashboard shows your personalized scholarships ranked by AI fit score
            </p>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              The Scholarship Search is Broken
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Here&apos;s what students in the Middle East face every day
            </p>
          </div>

          {/* Problem Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border-l-4 border-red-500">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Lost in Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Scholarships are scattered across 100+ websites in different languages with outdated information.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Average time to find scholarships: <strong>3-5 hours</strong>
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border-l-4 border-orange-500">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Weak Applications
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don&apos;t know if your CV, personal statement, or motivation letter is good enough.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Most students get rejected because of weak documents, not grades.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border-l-4 border-yellow-500">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Guidance
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don&apos;t know which scholarships you actually have a chance at.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Without personalized matching, you waste time on impossible targets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              We Solve This For You
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              3 features that change everything
            </p>
          </div>

          {/* Feature 1: Matching */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Smart Matching
                </h3>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Tell us about yourself once. Our AI matches you with scholarships you actually have a chance at.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Ranked by fit percentage (not random)</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Success probability estimates</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Personalized for YOUR goals</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 h-64 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-blue-200 dark:border-gray-700 w-full max-w-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">MEXT Scholarship</div>
                  <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/50 px-2 py-0.5 rounded-full">92% match</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">🇯🇵 Japan · Bachelor · Fully Funded</div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: "92%" }} />
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">92%</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1 rounded-md bg-gray-50 dark:bg-gray-700/50 px-2 py-1.5 text-[10px] text-gray-500 dark:text-gray-400">📅 45 days left</div>
                  <div className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold">View</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: AI Review */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 h-64 flex items-center justify-center order-2 md:order-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-green-200 dark:border-gray-700 w-full max-w-sm p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">8.5</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">AI Document Review</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Personal Statement</div>
                  </div>
                </div>
                <div className="space-y-1.5 pl-3 border-l-2 border-green-200 dark:border-green-800">
                  <div className="text-[10px] text-gray-600 dark:text-gray-300">✓ Strong opening hook</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-300">→ Add specific achievements</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className="h-1.5 rounded-full bg-green-500" style={{ width: "75%" }} />
                  </div>
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">75% improved</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg">
                  <Brain className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Document Review
                </h3>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Upload your CV or personal statement. Get professional feedback in seconds, not days.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Score out of 10</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Specific improvements (not just criticism)</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Track improvement across versions</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Progress Tracking */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Application Tracking
                </h3>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                See exactly what documents each scholarship needs and your progress on each one.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Clear roadmap for each application</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Deadline countdown</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Never miss an opportunity</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 h-64 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-gray-700 w-full max-w-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">MEXT Checklist</div>
                  <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">3/5 done</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-1.5 rounded-full bg-orange-500" style={{ width: "60%" }} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-xs">✅</span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">CV uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-xs">✅</span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">Personal statement reviewed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-xs">✅</span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">Recommendation letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 dark:text-gray-600 text-xs">○</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Transcript</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 dark:text-gray-600 text-xs">○</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Language test</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              4 simple steps to your perfect scholarship
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 dark:bg-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create a free account in 30 seconds
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 dark:bg-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tell Us About You</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Answer 10 questions about your background and goals
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 dark:bg-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Get Matches</h3>
              <p className="text-gray-600 dark:text-gray-400">
                See your top scholarships ranked by fit percentage
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 dark:bg-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Apply &amp; Improve</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload documents, get AI feedback, and improve your chances
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF SECTION */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Built on Real Research
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              44 students told us what they needed
            </p>
          </div>

          {/* Survey Stats */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-8 rounded-lg text-center border-t-4 border-blue-600">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">91%</div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">Interested in finding scholarships</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Out of 44 surveyed students</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-8 rounded-lg text-center border-t-4 border-green-600">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">88%</div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">Want AI document review</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">They need feedback on their applications</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-8 rounded-lg text-center border-t-4 border-orange-600">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">55%</div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">Willing to pay</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">They see value in the solution</p>
            </div>
          </div>

          {/* Key Quote */}
          <div className="mt-16 bg-gray-50 dark:bg-gray-800/50 p-8 rounded-lg border-l-4 border-blue-600 dark:border-blue-400">
            <p className="text-xl text-gray-700 dark:text-gray-300 italic">
              &ldquo;I spent 3 weeks searching for scholarships on different websites. ScholarshipAI found better options in minutes.&rdquo;
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-4">— Survey respondent, Grade 11</p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Common Questions
            </h2>
          </div>

          {/* FAQ Items */}
          <div className="space-y-6">
            <details className="group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-lg dark:shadow-black/20">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-gray-900 dark:text-white">
                Is this really free?
                <span className="transition group-open:rotate-180">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Yes! Forever. You get access to scholarship matching and 1 AI document review per month free. No credit card required.
              </p>
            </details>

            <details className="group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-lg dark:shadow-black/20">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-gray-900 dark:text-white">
                Will this actually help me get accepted?
                <span className="transition group-open:rotate-180">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                We can&apos;t guarantee acceptance, but we can help you: (1) Find scholarships you actually qualify for, and (2) Submit a stronger application. That&apos;s 2 things that directly increase your chances.
              </p>
            </details>

            <details className="group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-lg dark:shadow-black/20">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-gray-900 dark:text-white">
                How long does it take to set up?
                <span className="transition group-open:rotate-180">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Sign up (1 min) → Answer questions (5 mins) → Get matches (instant). You&apos;ll have your first 5 scholarships in under 10 minutes.
              </p>
            </details>

            <details className="group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-lg dark:shadow-black/20">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-gray-900 dark:text-white">
                What scholarships are included?
                <span className="transition group-open:rotate-180">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Currently: Government scholarships (MEXT, Chevening, Stipendium) and more. We&apos;re adding private scholarships soon. Focus: quality over quantity.
              </p>
            </details>

            <details className="group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-lg dark:shadow-black/20">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-gray-900 dark:text-white">
                Is my data safe?
                <span className="transition group-open:rotate-180">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Your data is encrypted and stored securely. We don&apos;t sell your information. We use it only to match you with scholarships and improve the platform.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-5xl font-bold mb-4">
            Ready to Find YOUR Scholarships?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join students across the Middle East who are getting matched with opportunities they actually qualify for.
          </p>
          <Link
            href="/auth/signup"
            className="bg-white text-blue-600 dark:text-blue-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-200 transition inline-flex items-center gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm mt-6 opacity-75">
            ✓ Free forever • ✓ No credit card • ✓ Takes 5 minutes
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-white font-bold text-lg mb-4">ScholarshipAI</div>
              <p className="text-sm">Finding perfect scholarships for Middle Eastern students.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 ScholarshipAI. Built by students, for students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
