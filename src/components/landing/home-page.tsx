'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Globe } from 'lucide-react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/landing/footer';
import { useLanguage } from '@/contexts/LanguageContext';

export function HomePage() {
  const { isRTL } = useLanguage();
  const direction = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={direction} className="min-h-screen bg-[#0a192f] text-white selection:bg-[#c6a14b]/30">
      <Nav />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
          {/* Grid Background */}
          <div className="grid-pattern absolute inset-0 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a192f]/50 to-[#0a192f] pointer-events-none" />
          
          <div className="page-container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Content */}
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8">
                  <Sparkles size={14} className="text-[#c6a14b]" />
                  <span className="text-xs font-medium tracking-wide uppercase">For Arab students worldwide</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8">
                  Find the <span className="text-white">scholarships</span> you <br />
                  <span className="text-[#c6a14b]">can actually win</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-gray-400 leading-relaxed mb-10 max-w-lg">
                  Stop scrolling past hundreds of scholarships you'll never qualify for. 
                  Tell us about yourself and we'll show you the ones that fit — with a dated plan for every step.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/signup" className="btn-primary">
                    Get matched <ArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />
                  </Link>
                  <Link href="/scholarships" className="btn-outline">
                    Browse scholarships
                  </Link>
                </div>
              </div>

              {/* Right Mockup */}
              <div className="relative">
                {/* Floating Elements */}
                <div className="absolute -top-12 left-1/4 animate-bounce duration-[3000ms]">
                   <div className="bg-[#162c4c] border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#c6a14b]/20 flex items-center justify-center">
                        <span className="text-[#c6a14b] text-xl">🎓</span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Doc review</p>
                        <p className="text-sm font-bold">8.6/10</p>
                      </div>
                   </div>
                </div>

                <div className="absolute top-1/2 -right-8 animate-pulse">
                   <div className="w-12 h-12 rounded-full bg-[#c6a14b] shadow-[0_0_30px_rgba(198,161,75,0.4)] flex items-center justify-center text-2xl">
                     🪙
                   </div>
                </div>

                {/* Main App Card */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white/10">
                  <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">app.smartscholar.org</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[10px] font-medium text-gray-400">Updated today</span>
                    </div>
                  </div>
                  
                  <div className="p-8 text-[#0a192f]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold">Your best matches</h3>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
                        <Sparkles size={10} className="text-[#c6a14b]" />
                        <span className="text-[10px] font-bold text-gray-500">AI matched</span>
                      </div>
                    </div>

                    {/* Scholarship Rows */}
                    <div className="space-y-6">
                      {[
                        { name: 'Chevening Scholarship', meta: 'United Kingdom · Master\'s', score: 92, days: 34 },
                        { name: 'Erasmus Mundus', meta: 'Europe · Master\'s', score: 87, days: 15 },
                        { name: 'DAAD Scholarship', meta: 'Germany · Master\'s / PhD', score: 78, days: 61 },
                      ].map((item, i) => (
                        <div key={i} className="group cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-400">{item.meta}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#c6a14b]">{item.score}%</p>
                              <p className="text-[9px] uppercase tracking-wider text-gray-400">fit</p>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#c6a14b] rounded-full transition-all duration-1000" style={{ width: `${item.score}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                             <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                <span>📅</span> {item.days} days left
                             </div>
                             <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                <span>📈</span> high probability
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating "Next Step" Popup */}
                <div className="absolute bottom-12 -right-12 animate-float">
                   <div className="bg-[#162c4c] border border-white/10 p-4 rounded-2xl shadow-2xl max-w-[160px]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] uppercase tracking-widest text-gray-400">Next Step</p>
                        <div className="w-4 h-4 rounded-full bg-[#c6a14b]/20 flex items-center justify-center">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#c6a14b]" />
                        </div>
                      </div>
                      <p className="text-xs font-bold mb-1">Book IELTS</p>
                      <p className="text-[10px] text-gray-400 mb-3">by 15 Nov</p>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#c6a14b] w-[85%]" />
                      </div>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Other sections can follow here... */}
      </main>
      
      <Footer />
    </div>
  );
}
