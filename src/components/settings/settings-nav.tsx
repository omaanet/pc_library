// src/components/settings/settings-nav.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Palette,
    User,
    Settings,
    Bell,
    BookOpen,
    Shield,
} from 'lucide-react';

const sidebarNavItems = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: Palette,
    },
    {
        title: 'Reading',
        href: '/settings/reading',
        icon: BookOpen,
    },
    {
        title: 'Notifications',
        href: '/settings/notifications',
        icon: Bell,
    },
    {
        title: 'Security',
        href: '/settings/security',
        icon: Shield,
    },
    {
        title: 'Advanced',
        href: '/settings/advanced',
        icon: Settings,
    },
] as const;

export function SettingsNav() {
    const pathname = usePathname();

    return (
        <div className="space-y-4">
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    Settings
                </h2>
                <div className="space-y-1">
                    {sidebarNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                                pathname === item.href
                                    ? 'bg-accent text-accent-foreground'
                                    : 'transparent'
                            )}
                        >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}