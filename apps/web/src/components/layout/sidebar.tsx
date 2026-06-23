'use client';

import {
  CreditCard,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Package,
  Palette,
  Ruler,
  Scissors,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { NavBadge } from '@/components/messages/nav-badge';
import { UpgradePromptDialog } from '@/components/subscription/upgrade-prompt-dialog';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useSubscription } from '@/hooks/use-subscription';
import type { PlanResource } from '@/lib/api';
import { cn } from '@/lib/utils';

type GatedNavFeature = 'styleStore' | 'messaging' | 'financialReports';

const navItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  gatedFeature?: GatedNavFeature;
}> = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/measurements', label: 'Measurements', icon: Ruler },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  {
    href: '/dashboard/styles',
    label: 'Style Store',
    icon: Palette,
    gatedFeature: 'styleStore',
  },
  { href: '/dashboard/production', label: 'Production', icon: Scissors },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  {
    href: '/dashboard/financials',
    label: 'Financials',
    icon: TrendingUp,
    gatedFeature: 'financialReports',
  },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    icon: MessageSquare,
    gatedFeature: 'messaging',
  },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  fashionHouseName?: string;
  onLogout: () => void;
}

export function Sidebar({ fashionHouseName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { count: unreadMessages } = useUnreadMessages();
  const { isFeatureLocked } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeResource, setUpgradeResource] = useState<PlanResource>();

  function handleNavClick(
    e: React.MouseEvent,
    item: (typeof navItems)[number],
  ) {
    if (!item.gatedFeature) return;
    if (isFeatureLocked(item.gatedFeature)) {
      e.preventDefault();
      setUpgradeResource(item.gatedFeature);
      setUpgradeOpen(true);
    }
  }

  return (
    <>
      <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="flex items-center gap-3 text-white">
            <LogoMark className="h-9 w-9" />
            <div>
              <p className="font-sans text-lg font-bold tracking-tight">
                Stitch<span className="text-gold">Hub</span>
              </p>
              {fashionHouseName && (
                <p className="max-w-[140px] truncate text-[11px] uppercase tracking-widest text-sidebar-muted">
                  {fashionHouseName}
                </p>
              )}
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-muted">
            Atelier
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const locked =
              item.gatedFeature && isFeatureLocked(item.gatedFeature);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-white/10 font-medium text-white shadow-sm'
                    : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground',
                  locked && 'opacity-90',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    active ? 'text-gold' : 'group-hover:text-gold/80',
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="h-3.5 w-3.5 text-gold/80" />}
                {item.href === '/dashboard/messages' && !locked && (
                  <NavBadge count={unreadMessages} className="bg-rose-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <UpgradePromptDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        resource={upgradeResource}
      />
    </>
  );
}
