'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight, Check, Brain, Target, TrendingUp, Sparkles, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/scholarship/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAVIGATION */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ScholarshipAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-40" />
        
        <div className="relative max-w-4xl mx-auto text-center pt-20 pb-16 px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            AI-Powered Scholarship Finder
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            Scholarships That
            <br />
            <span className="text-gradient">Actually Match You</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Stop scrolling through hundreds of random listings. Our AI finds scholarships
            you qualify for and coaches you through every application.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/signup"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              Find My Scholarships
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="bg-card border border-border text-card-foreground px-8 py-4 rounded-xl text-lg font-semibold hover:bg-accent transition-colors flex items-center justify-center gap-2"
            >
              See How It Works
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Free to start
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Results in minutes
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Built by students
            </span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
              <div className="h-3 w-3 rounded-full bg-danger/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
              <div className="ml-4 flex-1 max-w-sm mx-auto px-4 py-1 rounded-lg bg-background text-xs text-muted-foreground border border-border text-center">
                scholarshipai.app/dashboard
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-card-foreground">Welcome back, Ahmed</h3>
                  <p className="text-sm text-muted-foreground">You have 3 scholarships matching 90%+ your profile</p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hidden sm:block">
                  Browse All
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-xs text-muted-foreground mt-1">Active Matches</div>
                </div>
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="text-2xl font-bold text-success">4</div>
                  <div className="text-xs text-muted-foreground mt-1">Docs Reviewed</div>
                </div>
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <div className="text-2xl font-bold text-warning">8.2</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg Score</div>
                </div>
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <div className="text-2xl font-bold text-destructive">3</div>
                  <div className="text-xs text-muted-foreground mt-1">Due Soon</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇯🇵</span>
                      <div>
                        <div className="font-semibold text-card-foreground">MEXT Scholarship</div>
                        <div className="text-xs text-muted-foreground">Japan · Bachelor · Fully Funded</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">92% match</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: '92%' }} />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Dec 15, 2026</span>
                    <span className="font-medium text-warning">45 days left</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇬🇧</span>
                      <div>
                        <div className="font-semibold text-card-foreground">Chevening Award</div>
                        <div className="text-xs text-muted-foreground">UK · Master · Fully Funded</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">78% match</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: '78%' }} />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Feb 28, 2027</span>
                    <span className="font-medium text-muted-foreground">120 days left</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">The Problem</span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Finding Scholarships Shouldn&apos;t Be This Hard
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Students across the Middle East waste months searching scattered websites with outdated information.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-5">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">Drowning in Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                100+ websites, different languages, outdated deadlines. Students spend 3-5 hours just finding relevant scholarships.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-5">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">Rejected for Weak Documents</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your CV and personal statement might be getting you rejected — not your grades. Most students don&apos;t know until it&apos;s too late.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">No Personalized Guidance</h3>
              <p className="text-muted-foreground leading-relaxed">
                Without matching based on YOUR profile, you waste time applying to scholarships you have zero chance of getting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">The Solution</span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need, One Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three powerful features that replace hours of manual searching and guessing.
            </p>
          </div>

          {/* Feature 1: Smart Matching */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">Smart Matching</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Tell us about yourself once. Our AI finds scholarships where you have the highest success probability — not just random listings.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Ranked by fit percentage, not by who paid</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Success probability for every match</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Personalized to your goals and background</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6 flex items-center justify-center">
              <div className="bg-card rounded-xl shadow-lg border border-border w-full max-w-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-card-foreground">MEXT Scholarship</div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">92% fit</span>
                </div>
                <div className="text-sm text-muted-foreground">🇯🇵 Japan · Bachelor · Fully Funded</div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: '92%' }} />
                </div>
                <div className="flex gap-2">
                  <span className="flex-1 px-3 py-2 rounded-lg bg-muted text-xs text-muted-foreground">45 days left</span>
                  <span className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">View →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: AI Review */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 p-6 flex items-center justify-center order-2 md:order-1">
              <div className="bg-card rounded-xl shadow-lg border border-border w-full max-w-sm p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-success">8.5</span>
                  </div>
                  <div>
                    <div className="font-bold text-card-foreground">Document Review</div>
                    <div className="text-xs text-muted-foreground">Personal Statement</div>
                  </div>
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-success/30">
                  <div className="text-sm text-foreground">✓ Strong opening paragraph</div>
                  <div className="text-sm text-muted-foreground">→ Add specific achievements</div>
                  <div className="text-sm text-muted-foreground">→ Strengthen conclusion</div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-success" style={{ width: '75%' }} />
                </div>
                <div className="text-xs text-success font-medium">+75% improvement potential</div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-6">
                <Brain className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">AI Document Review</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Upload your CV or personal statement. Get professional, actionable feedback in seconds — not weeks.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Score out of 10 with detailed breakdown</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Specific improvements, not vague criticism</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Track your progress across versions</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Tracking */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-warning" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">Application Tracking</h3>
              <p className="text-lg text-muted-foreground mb-6">
                See exactly what each scholarship needs, track every document, and never miss a deadline again.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Clear checklist for each application</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Deadline countdowns with alerts</span>
                </li>
                <li className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Never miss an opportunity</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 p-6 flex items-center justify-center">
              <div className="bg-card rounded-xl shadow-lg border border-border w-full max-w-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-card-foreground">MEXT Checklist</div>
                  <span className="text-xs font-semibold text-warning">3/5 done</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-warning" style={{ width: '60%' }} />
                </div>
                <div className="space-y-2">
                  {['CV uploaded', 'Personal statement reviewed', 'Recommendation letter'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                  {['Transcript', 'Language certificate'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-border" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">How It Works</span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              From Sign Up to Scholarship in 10 Minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Create Account', desc: 'Sign up with email in 30 seconds. No credit card.' },
              { num: '02', title: 'Build Your Profile', desc: 'Answer 10 quick questions about your goals and background.' },
              { num: '03', title: 'Get Matched', desc: 'See your personalized scholarship list ranked by fit.' },
              { num: '04', title: 'Apply & Win', desc: 'Upload docs, get AI feedback, and submit stronger applications.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">Validated by Students</span>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Built on Real Research
            </h2>
            <p className="text-lg text-muted-foreground">
              44 students told us what they actually need
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card p-8 rounded-2xl border border-border text-center">
              <div className="text-4xl font-bold text-primary mb-2">91%</div>
              <p className="text-card-foreground font-semibold">Want AI-powered scholarship search</p>
              <p className="text-sm text-muted-foreground mt-2">of 44 surveyed students</p>
            </div>
            <div className="bg-card p-8 rounded-2xl border border-border text-center">
              <div className="text-4xl font-bold text-success mb-2">88%</div>
              <p className="text-card-foreground font-semibold">Need document review feedback</p>
              <p className="text-sm text-muted-foreground mt-2">They can&apos;t tell if their docs are strong enough</p>
            </div>
            <div className="bg-card p-8 rounded-2xl border border-border text-center">
              <div className="text-4xl font-bold text-warning mb-2">55%</div>
              <p className="text-card-foreground font-semibold">Ready to pay for this solution</p>
              <p className="text-sm text-muted-foreground mt-2">They see the value in a tool like this</p>
            </div>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border">
            <blockquote className="text-xl text-card-foreground italic leading-relaxed">
              &ldquo;I spent 3 weeks searching for scholarships across different websites. ScholarshipAI found better options in minutes.&rdquo;
            </blockquote>
            <p className="text-muted-foreground mt-4 text-sm">— Survey respondent, Grade 11 student</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is this really free?',
                a: 'Yes — forever. You get scholarship matching and 1 AI document review per month at no cost. No credit card required to sign up.',
              },
              {
                q: 'Will this help me actually get accepted?',
                a: 'We can\'t guarantee acceptance, but we help you find scholarships you qualify for AND submit stronger applications. Those two things directly increase your chances.',
              },
              {
                q: 'How fast is setup?',
                a: 'Sign up (1 min) → Answer questions (5 mins) → Get matches (instant). You\'ll have your first scholarships in under 10 minutes.',
              },
              {
                q: 'What scholarships do you cover?',
                a: 'Currently: Major government scholarships (MEXT, Chevening, Stipendium Hungaricum, DAAD, and more). We\'re expanding to private scholarships monthly.',
              },
              {
                q: 'Is my data safe?',
                a: 'Your data is encrypted and stored securely. We never sell your information. It\'s used only to match you with scholarships and improve the platform.',
              },
            ].map((faq) => (
              <details key={faq.q} className="group bg-card p-6 rounded-xl border border-border">
                <summary className="flex cursor-pointer items-center justify-between font-bold text-card-foreground list-none">
                  {faq.q}
                  <span className="ml-4 transition group-open:rotate-45 text-muted-foreground">
                    <span className="text-2xl leading-none">+</span>
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Ready to Find Your Scholarships?
          </h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Join students getting matched with opportunities they actually qualify for.
          </p>
          <Link
            href="/auth/signup"
            className="bg-primary-foreground text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-lg"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm mt-6 opacity-75">
            Free forever · No credit card · Takes 5 minutes
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-card-foreground">ScholarshipAI</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered scholarship finder for students worldwide.</p>
            </div>
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/glossary" className="hover:text-foreground transition-colors">Glossary</Link></li>
                <li><Link href="/success-stories" className="hover:text-foreground transition-colors">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 ScholarshipAI. Built by students, for students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
