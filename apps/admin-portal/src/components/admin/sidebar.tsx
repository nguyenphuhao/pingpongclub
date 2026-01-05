'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Shield,
  Users,
  Trophy,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'User Accounts',
        href: '/users',
        icon: Shield,
        badge: '🔐',
      },
    ],
  },
  {
    title: 'Club',
    items: [
      {
        label: 'Members',
        href: '/members',
        icon: Users,
        badge: '🏸',
      },
      {
        label: 'Tournaments',
        href: '/tournaments',
        icon: Trophy,
        badge: '🏆',
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex flex-col items-center justify-center border-b px-6 py-4">
        <Image
          src="/icon.png"
          alt="Pingclub Logo"
          width={40}
          height={40}
          className="mb-2"
        />
        <h2 className="text-sm font-semibold">PINGCLUB Admin</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

