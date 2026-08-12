'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Globe, Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

export function Nav() {
  const { isRTL, toggleLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/scholarships', label: 'Scholarships' },
  ];

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full transition-all duration-300',
      isScrolled ? 'border-b border-white/5 bg-[#0a192f]/80 backdrop-blur-md py-3' : 'bg-transparent py-5'
    )}>
      <div className='page-container flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2 font-bold text-xl tracking-tight text-white'>
          <div className="w-8 h-8 rounded-lg bg-[#c6a14b] flex items-center justify-center text-[#0a192f] text-sm">S</div>
          {BRAND.name}
        </Link>

        <nav className='hidden items-center gap-8 md:flex'>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className='text-sm font-medium text-gray-400 transition hover:text-white'>
              {link.label}
            </Link>
          ))}
          <div className='h-4 w-px bg-white/10' />
          <button onClick={toggleLanguage} className='flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white'>
            <Globe size={16} />
            {isRTL ? 'English' : 'AR'}
          </button>
          {user ? (
            <Link href='/dashboard' className='btn-primary min-h-10 px-5 text-sm'>
              Dashboard
            </Link>
          ) : (
            <div className='flex items-center gap-6'>
              <Link href='/auth/login' className='text-sm font-medium text-gray-400 transition hover:text-white'>
                Log in
              </Link>
              <Link href='/auth/signup' className='btn-primary min-h-10 px-5 text-sm'>
                Get started
              </Link>
            </div>
          )}
        </nav>

        <button className='md:hidden text-white' onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className='fixed inset-0 z-40 bg-[#0a192f] md:hidden'>
          <div className='flex h-full flex-col p-8'>
            <div className='flex items-center justify-between'>
              <span className='font-bold text-xl'>{BRAND.name}</span>
              <button onClick={() => setMobileOpen(false)}><X /></button>
            </div>
            <div className='mt-12 flex flex-col gap-8'>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className='text-2xl font-semibold'>
                  {link.label}
                </Link>
              ))}
              <button onClick={() => { toggleLanguage(); setMobileOpen(false); }} className='flex items-center gap-3 text-2xl font-semibold'>
                <Globe /> {isRTL ? 'English' : 'العربية'}
              </button>
            </div>
            <div className='mt-auto'>
              <Link href='/auth/signup' className='btn-primary w-full py-4 text-lg'>
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
