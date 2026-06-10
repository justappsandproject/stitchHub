'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/10 bg-[hsl(260_32%_8%/0.85)] backdrop-blur-xl'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="text-white">
          <Logo markClassName="h-9 w-9" wordmarkClassName="text-white" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {[
            ['Features', '#features'],
            ['How it works', '#showcase'],
            ['Pricing', '#pricing'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            asChild
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            className="bg-white text-[hsl(260_32%_12%)] shadow-lg shadow-primary/20 hover:bg-white/90"
          >
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
