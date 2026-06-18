'use client';

import {
  LayoutDashboard,
  LogOut,
  Palette,
  Ruler,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/customer', label: 'Home', icon: LayoutDashboard },
  { href: '/customer/styles', label: 'Lookbook', icon: Palette },
  { href: '/customer/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/customer/measurements', label: 'Measurements', icon: Ruler },
  { href: '/customer/settings', label: 'Settings', icon: Settings },
];

interface CustomerSidebarProps {
  fashionHouseName?: string;
  onLogout: () => void;
}

export function CustomerSidebar({
  fashionHouseName,
  onLogout,
}: CustomerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/customer" className="flex items-center gap-3 text-white">
          <LogoMark className="h-9 w-9" />
          <div>
            <p className="font-sans text-lg font-bold tracking-tight">
              Stitch<span className="text-gold">Hub</span>
            </p>
            <p className="text-[11px] uppercase tracking-widest text-sidebar-muted">
              Customer
            </p>
          </div>
        </Link>
      </div>

      {fashionHouseName && (
        <div className="border-b border-sidebar-border px-6 py-4">
          <p className="text-[11px] uppercase tracking-wider text-sidebar-muted">
            Your fashion house
          </p>
          <p className="mt-1 truncate text-sm font-medium text-white">
            {fashionHouseName}
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/customer'
              ? pathname === '/customer'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-white'
                  : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
