'use client';

import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const tabs = [
  {
    id: 'measurements',
    label: 'Measurements',
    title: 'Never lose a measurement again',
    description:
      'Store chest, waist, hip, and custom fields with full version history. Export to PDF for fittings or share with your team instantly.',
    highlights: [
      'Men, women & children templates',
      'Version history on every update',
      'One-click PDF export',
    ],
    preview: (
      <div className="space-y-3 p-2">
        {[
          { label: 'Chest', value: '42"', active: true },
          { label: 'Waist', value: '34"', active: false },
          { label: 'Hip', value: '40"', active: false },
          { label: 'Shoulder', value: '18"', active: false },
        ].map((row) => (
          <div
            key={row.label}
            className={cn(
              'flex items-center justify-between rounded-xl px-4 py-3 transition-colors',
              row.active
                ? 'bg-primary/10 ring-1 ring-primary/20'
                : 'bg-muted/50',
            )}
          >
            <span className="text-sm font-medium">{row.label}</span>
            <span className="font-heading text-sm font-bold">{row.value}</span>
          </div>
        ))}
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-center text-xs text-primary">
          + Add custom field
        </div>
      </div>
    ),
  },
  {
    id: 'production',
    label: 'Production',
    title: 'See every order move through your atelier',
    description:
      'Drag orders across your kanban board from New to Delivered. Assign tailors, set deadlines, and never miss a fitting again.',
    highlights: [
      'Visual kanban workflow',
      'Staff assignment per stage',
      'Deadline & fitting reminders',
    ],
    preview: (
      <div className="grid grid-cols-3 gap-2 p-2">
        {['Cutting', 'Sewing', 'Ready'].map((stage, i) => (
          <div key={stage} className="rounded-xl bg-muted/40 p-2">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {stage}
            </p>
            {[0, 1].slice(0, i === 1 ? 2 : 1).map((n) => (
              <div
                key={n}
                className="mb-1.5 rounded-lg border bg-card p-2 shadow-sm"
              >
                <div
                  className={cn(
                    'mb-1 h-1 w-6 rounded-full',
                    i === 0
                      ? 'bg-rose-500'
                      : i === 1
                        ? 'bg-amber-500'
                        : 'bg-emerald-500',
                  )}
                />
                <div className="h-1 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'billing',
    label: 'Billing',
    title: 'Get paid faster, look more professional',
    description:
      'Create invoices, record deposits and balance payments, and auto-generate receipts your clients will actually appreciate.',
    highlights: [
      'Invoice & receipt generation',
      'Partial payment tracking',
      'Payment history per customer',
    ],
    preview: (
      <div className="space-y-3 p-2">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Invoice #1042</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
              Paid
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-bold">₦185,000</p>
          <p className="text-xs text-muted-foreground">
            Wedding gown — Adaeze O.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Invoice #1043</span>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
              Partial
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-bold">₦95,000</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-primary to-rose-500" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            ₦57,000 of ₦95,000 received
          </p>
        </div>
      </div>
    ),
  },
];

export function LandingShowcase() {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active)!;

  return (
    <section id="showcase" className="bg-muted/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Designed for the way you actually work
          </h2>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                'rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200',
                active === tab.id
                  ? 'bg-gradient-to-r from-primary to-rose-500 text-white shadow-lg shadow-primary/25'
                  : 'bg-card text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-md',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <h3 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {current.title}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {current.description}
            </p>
            <ul className="mt-8 space-y-3">
              {current.highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="order-1 lg:order-2">
            <div className="border-gradient overflow-hidden rounded-2xl bg-card shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs text-muted-foreground">
                  StitchHub — {current.label}
                </span>
              </div>
              <div className="min-h-[280px] transition-all duration-300">
                {current.preview}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
