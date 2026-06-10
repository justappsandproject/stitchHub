import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingCta() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="landing-mesh landing-grid-pattern relative overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-rose-500/20" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to modernize your atelier?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/65">
              Join fashion businesses already running on StitchHub. Set up in
              minutes, not days.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-full bg-white px-8 text-base font-semibold text-[hsl(260_32%_12%)] hover:bg-white/90"
              >
                <Link href="/register">
                  Get started free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
