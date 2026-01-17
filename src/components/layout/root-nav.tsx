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
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Book,
    Library,
    Mail,
    Menu,
    UserCircle,
    LogOut,
} from 'lucide-react';

export function RootNav({
    onAuthClick,
    isAuthenticated = false,
}: {
    onAuthClick: () => void;
    isAuthenticated?: boolean;
}) {
    const { logout, state } = useAuth();
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
                <div className="flex items-center space-x-4">
                    <div className="inline-flex items-center text-xs sm:text-sm text-muted-foreground">
                        <a
                            href={`mailto:${SITE_CONFIG.CONTACT_EMAIL}`}
                            className="flex items-center gap-1.5 align-middle hover:text-yellow-400 transition-colors"
                            rel="nofollow"
                        >
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                            <span className="whitespace-nowrap">{SITE_CONFIG.CONTACT_EMAIL}</span>
                        </a>
                    </div>

                    <ThemeSwitcher />

                    {/* User Menu or Auth Button */}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 text-xs sm:text-sm">
                                    <UserCircle className="h-5 w-5" />
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
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
                                            <Link href="/add-book">Gestisci Racconti</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />

                                        {(state.user?.userLevel ?? 0) > 1 && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/user-statistics" className="font-semibold text-yellow-500 hover:text-red-600">Statistiche</Link>
                                                </DropdownMenuItem>
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
                                <Link
                                    href="/add-book"
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        pathname === "/add-book" && "text-primary"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Aggiungi Racconto
                                </Link>
                                <Link
                                    href="/user-statistics"
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        pathname === "/user-statistics" && "text-primary"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Stats
                                </Link>
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