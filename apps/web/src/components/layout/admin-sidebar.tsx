'use client';

import {
  Building2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from '@/components/brand/logo';
import { NavBadge } from '@/components/messages/nav-badge';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Fashion Houses', icon: Building2 },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const { count: unreadMessages } = useUnreadMessages();

  return (
    <aside className="flex h-screen w-64 flex-col bg-[hsl(260_32%_10%)] text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <LogoMark className="h-9 w-9" />
          <div>
            <p className="font-heading text-lg font-bold tracking-tight">
              Stitch<span className="text-gradient">Hub</span>
            </p>
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/50">
              <Shield className="h-3 w-3" />
              Platform Admin
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <p className="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
          Management
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/admin'
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-white/10 font-medium text-white shadow-sm'
                  : 'text-white/55 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  active ? 'text-violet-300' : 'group-hover:text-violet-300/80',
                )}
              />
              {item.label}
              {item.href === '/admin/messages' && (
                <NavBadge count={unreadMessages} />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
