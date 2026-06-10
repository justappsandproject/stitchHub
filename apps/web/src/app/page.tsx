import { LandingCta } from '@/components/landing/landing-cta';
import { LandingFeatures } from '@/components/landing/landing-features';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingHeader } from '@/components/landing/landing-header';
import { LandingHero } from '@/components/landing/landing-hero';
import { LandingMarquee } from '@/components/landing/landing-marquee';
import { LandingPricing } from '@/components/landing/landing-pricing';
import { LandingShowcase } from '@/components/landing/landing-showcase';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <LandingHero />
      <LandingMarquee />
      <LandingFeatures />
      <LandingShowcase />
      <LandingPricing />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
