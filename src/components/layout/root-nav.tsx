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
import { ADMIN_ROLES, isPowerAdminLevel, isSuperAdminLevel } from '@/config/admin-roles';
import {
    Mail,
    UserCircle,
    LogOut,
    CircleHelp,
} from 'lucide-react';

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
                    {isAuthenticated && (
                        <Link
                            href="/guida"
                            className={cn(
                                "flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors",
                                "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                pathname === "/guida" && "bg-accent text-accent-foreground"
                            )}
                            aria-current={pathname === "/guida" ? "page" : undefined}
                        >
                            <CircleHelp className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                            <span>Guida</span>
                        </Link>
                    )}

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
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">Impostazioni</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {state.user?.isAdmin && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/add-book?tab=manage" className="flex items-center gap-2">
                                                <AdminRoleIcon level={ADMIN_ROLES.ADMIN} className="h-4 w-4" />
                                                Gestisci Racconti
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />

                                        {isPowerAdminLevel(state.user?.userLevel) && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/user-statistics" className="flex items-center gap-2 font-semibold text-yellow-500 hover:text-red-600"><AdminRoleIcon level={ADMIN_ROLES.POWER_ADMIN} className="h-4 w-4" />Statistiche</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/animations-manager" className="flex items-center gap-2 font-semibold text-yellow-500 hover:text-red-600"><AdminRoleIcon level={ADMIN_ROLES.POWER_ADMIN} className="h-4 w-4" />Animazioni</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/admin/migrations" className="flex items-center gap-2 font-semibold text-yellow-500 hover:text-red-600"><AdminRoleIcon level={ADMIN_ROLES.POWER_ADMIN} className="h-4 w-4" />Migrazioni DB</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/admin/promo-pages" className="flex items-center gap-2 font-semibold text-yellow-500 hover:text-red-600"><AdminRoleIcon level={ADMIN_ROLES.POWER_ADMIN} className="h-4 w-4" />Pagine Promo</Link>
                                                </DropdownMenuItem>
                                                {isSuperAdminLevel(state.user?.userLevel) && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/admin/users" className="flex items-center gap-2 font-semibold text-yellow-500 hover:text-red-600"><AdminRoleIcon level={ADMIN_ROLES.SUPER_ADMIN} className="h-4 w-4" />Gestisci Utenti</Link>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                    </>
                                )}

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
                                <Link href="/settings">
                                    Impostazioni
                                </Link>
                                {state.user?.isAdmin && (
                                    <Link href="/add-book" className="flex items-center gap-2 text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                        <AdminRoleIcon level={ADMIN_ROLES.ADMIN} className="h-4 w-4" />Gestisci Racconti
                                    </Link>
                                )}
                                {isPowerAdminLevel(state.user?.userLevel) && (
                                    <>
                                        <Link href="/user-statistics" className="flex items-center gap-2 text-sm font-semibold text-yellow-500" onClick={() => setIsMobileMenuOpen(false)}><AdminRoleIcon level={ADMIN_ROLES.POWER_ADMIN} className="h-4 w-4" />Statistiche</Link>
                                        <Link href="/animations-manager" className="flex items-center gap-2 text-sm font-semibold text-yellow-500" onClick={() => setIsMobileMenuOpen(false)}><AdminRoleIcon level={ADMIN_ROLES.POWER_ADMIN} className="h-4 w-4" />Animazioni</Link>
                                        <Link href="/admin/migrations" className="flex items-center gap-2 text-sm font-semibold text-yellow-500" onClick={() => setIsMobileMenuOpen(false)}><AdminRoleIcon level={ADMIN_ROLES.POWER_ADMIN} className="h-4 w-4" />Migrazioni DB</Link>
                                        <Link href="/admin/promo-pages" className="flex items-center gap-2 text-sm font-semibold text-yellow-500" onClick={() => setIsMobileMenuOpen(false)}><AdminRoleIcon level={ADMIN_ROLES.POWER_ADMIN} className="h-4 w-4" />Pagine Promo</Link>
                                    </>
                                )}
                                {isSuperAdminLevel(state.user?.userLevel) && (
                                    <Link href="/admin/users" className="flex items-center gap-2 text-sm font-semibold text-yellow-500" onClick={() => setIsMobileMenuOpen(false)}><AdminRoleIcon level={ADMIN_ROLES.SUPER_ADMIN} className="h-4 w-4" />Gestisci Utenti</Link>
                                )}
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
