import {
  ArrowRight,
  Check,
  Ruler,
  Scissors,
  ShoppingBag,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { PLAN_CONFIG } from '@stitchhub/shared';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo className="text-primary" markClassName="h-9 w-9" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-28 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-sm text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Built for African fashion businesses
          </div>
          <h1 className="mx-auto max-w-3xl font-display text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            From measurement to delivery, beautifully managed
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Replace measurement books, paper invoices, and WhatsApp order
            tracking with one centralized platform for tailors, designers, and
            boutiques.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in to your account</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-card">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Users,
                  title: 'Customer Management',
                  desc: 'Profiles, tags, VIP tracking, and full order history',
                },
                {
                  icon: Ruler,
                  title: 'Measurement Vault',
                  desc: 'Digital measurements with versioning and PDF export',
                },
                {
                  icon: ShoppingBag,
                  title: 'Order Tracking',
                  desc: 'From new order to delivery with production workflow',
                },
                {
                  icon: Scissors,
                  title: 'Production Board',
                  desc: 'Kanban workflow with staff assignment and progress',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-background p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-12 text-center">
              <h2 className="font-display text-4xl font-semibold tracking-tight">
                Simple, transparent pricing
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Start with a 14-day free trial. Upgrade as your atelier grows.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {(
                Object.entries(PLAN_CONFIG) as Array<
                  [string, (typeof PLAN_CONFIG)[keyof typeof PLAN_CONFIG]]
                >
              ).map(([key, plan]) => {
                const isPopular = key === 'PROFESSIONAL';
                return (
                  <div
                    key={key}
                    className={cn(
                      'relative flex flex-col rounded-xl border bg-card p-8',
                      isPopular
                        ? 'border-primary shadow-lg'
                        : 'transition-shadow hover:shadow-md',
                    )}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                        Most popular
                      </span>
                    )}
                    <h3 className="font-display text-xl font-semibold">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.tagline}
                    </p>
                    <p className="mt-4">
                      <span className="font-display text-4xl font-semibold">
                        ₦{plan.priceNgn.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /month
                      </span>
                    </p>
                    <ul className="mb-8 mt-6 flex-1 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={isPopular ? 'default' : 'outline'}
                      size="lg"
                      asChild
                    >
                      <Link href="/register">Start free trial</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} StitchHub. All rights reserved.
      </footer>
    </div>
  );
}
