'use client';

import { SITE_CONFIG } from '@/config/site-config';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/auth-context';
import { AdminRoleIcon } from '@/components/admin/admin-role-icon';
import type { ManagedPageConfig } from '@/config/managed-pages';
import { getAdminRoleMenuClass } from '@/lib/admin-role-menu';
import {
    CircleHelp,
    Mail,
    UserCircle,
    LogOut,
    Settings as SettingsIcon,
} from 'lucide-react';

function ManagedPageMenuIcon({ page }: { page: ManagedPageConfig }) {
    if (page.menuIcon === 'settings') return <SettingsIcon className="h-4 w-4" aria-hidden="true" />;
    if (page.menuIcon === 'circle-help') return <CircleHelp className="h-4 w-4" aria-hidden="true" />;
    return <AdminRoleIcon level={page.accessLevel} className="h-4 w-4" />;
}

export function RootNav({
    onAuthClick,
    isAuthenticated = false,
}: {
    onAuthClick: () => void;
    isAuthenticated?: boolean;
}) {
    const { logout, refreshSession, state } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [managedPages, setManagedPages] = React.useState<ManagedPageConfig[]>([]);

    React.useEffect(() => {
        if (!isAuthenticated) {
            setManagedPages([]);
            return;
        }
        let active = true;
        fetch('/api/navigation-pages', { cache: 'no-store' })
            .then((response) => response.ok ? response.json() : Promise.reject(new Error('Menu unavailable')))
            .then((data: { pages?: ManagedPageConfig[] }) => {
                if (active) setManagedPages(data.pages ?? []);
            })
            .catch(() => {
                if (active) setManagedPages([]);
            });
        return () => { active = false; };
    }, [isAuthenticated, state.user?.userLevel]);

    return (
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-center px-4 header-fading-border">
            <div className="container-fluid flex h-16 items-center justify-between mx-auto">
                {/* Logo and Brand */}
                <Link href="/" className="flex items-center">
                    {/* <Library className="h-6 w-6" /> */}
                    <svg width="55" height="65" viewBox="0 0 80 110" fill="none" stroke="currentColor" className="mt-3">
                        <g transform="translate(-20.5 -5.5)" strokeWidth="4" shapeRendering="geometricPrecision" vectorEffect="non-scaling-stroke">
                            {/* Feather Quill */}
                            <path d="M20.5 90.5 C 20 90, 40 50, 80 10 C 80 10, 60 40, 50 60" stroke="var(--text-quill)" strokeLinecap="round" strokeLinejoin="round" />
                            {/* The Ink turning into Wave */}
                            <path d="M20.5 90.5 C 25 90, 30 95, 35 90 S 45 85, 50 90 S 60 95, 65 90" stroke="var(--gold-main)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                <animate attributeName="d" values="M20 90.5 C 25 90, 30 95, 35 90 S 45 85, 50 90 S 60 95, 65 90; M20 90.5 C 25 88, 30 92, 35 90 S 45 88, 50 90 S 60 92, 65 90; M20 90.5 C 25 90, 30 95, 35 90 S 45 85, 50 90 S 60 95, 65 90"
                                    dur="2s" repeatCount="indefinite" />
                            </path>
                        </g>
                    </svg>
                </Link>

                {/* Desktop Navigation */}
                {/* <nav className="hidden md:flex items-center space-x-6">
                    {isAuthenticated && false && (
                        <Link
                            href="/my-books"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === "/my-books" && "text-primary"
                            )}
                        >
                            La mia libreria
                        </Link>
                    )}
                </nav> */}

                {/* Actions */}
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-4">
                    <div className="inline-flex items-center text-xs sm:text-sm text-muted-foreground">
                        <a
                            href={`mailto:${SITE_CONFIG.CONTACT_EMAIL}`}
                            className="flex min-h-11 items-center gap-1.5 rounded-md px-1.5 align-middle transition-colors hover:text-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            rel="nofollow"
                            aria-label={`Scrivi a ${SITE_CONFIG.CONTACT_EMAIL}`}
                        >
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                            <span className="hidden whitespace-nowrap md:inline">{SITE_CONFIG.CONTACT_EMAIL}</span>
                        </a>
                    </div>

                    <ThemeSwitcher />

                    {/* User Menu or Auth Button */}
                    {isAuthenticated ? (
                        <DropdownMenu onOpenChange={(open) => {
                            if (open) void refreshSession();
                        }}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 text-xs sm:text-sm">
                                    <UserCircle className="h-5 w-5" />
                                    <div className="flex items-center gap-2">
                                        <span className="hidden font-medium sm:inline">
                                            {state.user?.name || state.user?.fullName || 'Utente'}
                                        </span>
                                        {/* {state.user?.isAdmin && (
                                            <span className="text-[11px] bg-yellow-400 text-black px-1 py-0 rounded-full font-semibold tracking-wider">
                                                {state.user?.userLevel && state.user.userLevel}
                                            </span>
                                        )} */}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {managedPages.map((page, index) => (
                                    <React.Fragment key={page.key}>
                                        {index > 0 && managedPages[index - 1].accessLevel !== page.accessLevel && <DropdownMenuSeparator />}
                                        <DropdownMenuItem asChild className={getAdminRoleMenuClass(page.accessLevel)}>
                                            <Link
                                                href={page.href}
                                                className={cn('flex items-center gap-2', pathname === page.href.split('?')[0] && 'bg-accent')}
                                            >
                                                <ManagedPageMenuIcon page={page} />
                                                {page.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    </React.Fragment>
                                ))}
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => logout()}
                                >
                                    <div className="flex items-center gap-2">
                                        <LogOut className="h-4 w-4" />
                                        <span>Esci</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="outline"
                            size="default"
                            onClick={onAuthClick}
                            className="h-9 text-xs sm:text-sm"
                        >
                            Accedi
                        </Button>
                    )}

                    {/* Mobile Menu Button */}
                    {/* <Button
                        variant="ghost"
                        className="md:hidden"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu className="h-7 w-7" />
                        <span className="sr-only">Toggle menu</span>
                    </Button> */}
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t">
                    <nav className="flex flex-col space-y-4 p-4">

                        {isAuthenticated ? (
                            <>
                                {managedPages.map((page) => (
                                    <Link key={page.key} href={page.href} className={cn('flex items-center gap-2 text-sm font-medium', getAdminRoleMenuClass(page.accessLevel))} onClick={() => setIsMobileMenuOpen(false)}>
                                        <ManagedPageMenuIcon page={page} />{page.label}
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login">
                                    Accedi
                                </Link>
                                <Link href="/auth/register">
                                    Registrati
                                </Link>
                            </>)}
                    </nav>
                </div>
            )}

        </header>
    );
}
