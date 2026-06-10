import {
  BarChart3,
  CreditCard,
  Ruler,
  Scissors,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Customer CRM',
    desc: 'Profiles, VIP tags, order history, and notes — all in one elegant view.',
    className: 'md:col-span-2 md:row-span-1',
    accent: 'from-violet-500/20 to-transparent',
  },
  {
    icon: Ruler,
    title: 'Measurement Vault',
    desc: 'Versioned digital measurements with templates and PDF export.',
    className: 'md:col-span-1',
    accent: 'from-rose-500/20 to-transparent',
  },
  {
    icon: ShoppingBag,
    title: 'Order Pipeline',
    desc: 'Track every garment from first fitting to final delivery.',
    className: 'md:col-span-1',
    accent: 'from-amber-500/20 to-transparent',
  },
  {
    icon: Scissors,
    title: 'Production Kanban',
    desc: 'Visual workflow board with staff assignment and live progress.',
    className: 'md:col-span-2',
    accent: 'from-emerald-500/20 to-transparent',
  },
  {
    icon: CreditCard,
    title: 'Invoices & Payments',
    desc: 'Send invoices, record partial payments, and generate receipts instantly.',
    className: 'md:col-span-1',
    accent: 'from-primary/20 to-transparent',
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    desc: 'Revenue trends, order volume, and plan usage at a glance.',
    className: 'md:col-span-1',
    accent: 'from-rose-500/20 to-transparent',
  },
  {
    icon: Sparkles,
    title: 'Multi-tenant SaaS',
    desc: 'Each fashion house gets its own isolated workspace with role-based access.',
    className: 'md:col-span-2',
    accent: 'from-violet-500/20 to-transparent',
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            Everything you need
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            One platform for your entire{' '}
            <span className="font-display italic text-primary">atelier</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Stop juggling WhatsApp threads, paper measurement books, and
            scattered spreadsheets. StitchHub brings it all together.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-4 md:grid-rows-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 ${feature.className}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${feature.accent}`}
              />
              <div className="relative">
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary/10 to-rose-500/10 p-3 text-primary transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
