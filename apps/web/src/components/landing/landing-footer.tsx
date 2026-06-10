import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function LandingFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <Logo className="text-foreground" markClassName="h-8 w-8" />
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#showcase" className="hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Register
            </Link>
          </nav>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} StitchHub. Crafted for fashion businesses
          across Africa.
        </div>
      </div>
    </footer>
  );
}
