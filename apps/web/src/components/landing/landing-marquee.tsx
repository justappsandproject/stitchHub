const items = [
  'Bespoke Tailors',
  'Bridal Ateliers',
  'Fashion Designers',
  'Ready-to-Wear Boutiques',
  'Corporate Uniforms',
  'Alterations Studios',
  'Luxury Fashion Houses',
  'Aso-Ebi Specialists',
];

export function LandingMarquee() {
  const doubled = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-border bg-card py-5">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="mx-8 inline-flex items-center gap-3 text-sm font-medium text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-rose-500" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
