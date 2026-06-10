import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PLAN_CONFIG } from '@stitchhub/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LandingPricing() {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Grow at your own pace
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            14-day free trial on Starter. No credit card required. Upgrade when
            your atelier is ready.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
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
                  'relative flex flex-col rounded-2xl border bg-card p-8 transition-all duration-300',
                  isPopular
                    ? 'scale-[1.02] border-primary shadow-2xl shadow-primary/15 ring-1 ring-primary/20'
                    : 'hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl',
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-primary to-rose-500 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.tagline}
                </p>
                <p className="mt-6">
                  <span className="font-heading text-5xl font-bold tracking-tight">
                    ₦{plan.priceNgn.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/mo</span>
                </p>
                <ul className="mb-8 mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isPopular ? 'default' : 'outline'}
                  size="lg"
                  asChild
                  className={cn(
                    'h-12 rounded-full font-semibold',
                    isPopular &&
                      'bg-gradient-to-r from-primary to-rose-500 shadow-lg shadow-primary/20 hover:opacity-90',
                  )}
                >
                  <Link href="/register">Start free trial</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
