'use client';

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
    Menu,
    UserCircle,
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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-center">
            <div className="container flex h-16 items-center justify-between mx-auto">
                {/* Logo and Brand */}
                <Link href="/" className="flex items-center space-x-2">
                    <Library className="h-6 w-6" />
                    {/* <span className="font-bold">Racconti in Voce e Caratteri</span> */}
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    {/* <Link
                        href="/books"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary",
                            pathname === "/books" && "text-primary"
                        )}
                    >
                        Racconti
                    </Link> */}

                    {/* {isAuthenticated && false && (
                        <Link
                            href="/audiobooks"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === "/audiobooks" && "text-primary"
                            )}
                        >
                            Audioracconti
                        </Link>
                    )} */}

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
                </nav>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    <ThemeSwitcher />

                    {/* User Menu or Auth Button */}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                                    <UserCircle className="h-5 w-5" />
                                    <span className="font-medium text-sm">{state.user?.name || 'Utente'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">Impostazioni</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild disabled={true}>
                                    <Link href="/my-books">La mia libreria</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {state.user?.isAdmin && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/add-book">Gestisci Racconti</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}

                                <DropdownMenuItem onClick={() => logout()}>
                                    Esci
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onAuthClick}
                        >
                            Accedi
                        </Button>
                    )}

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        className="md:hidden"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t">
                    <nav className="flex flex-col space-y-4 p-4">
                        <Link href="/settings">
                            Impostazioni
                        </Link>
                        {/* <Link
                            href="/books"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === "/books" && "text-primary"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Racconti
                        </Link>
                        <Link
                            href="/audiobooks"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === "/audiobooks" && "text-primary"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Audioracconti
                        </Link> */}
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
                        {isAuthenticated && (
                            <Link
                                href="/my-books"
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname === "/my-books" && "text-primary"
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                La mia libreria
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}