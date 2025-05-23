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
    Mail,
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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-center px-4">
            <div className="container-fluid flex h-16 items-center justify-between mx-auto">
                {/* Logo and Brand */}
                <Link href="/" className="flex items-center">
                    <Library className="h-6 w-6" />
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
                            href="&#109;&#97;&#105;&#108;&#116;&#111;&#58;&#114;&#97;&#99;&#99;&#111;&#110;&#116;&#105;&#64;&#112;&#105;&#101;&#114;&#111;&#99;&#97;&#114;&#98;&#111;&#110;&#101;&#116;&#116;&#105;&#46;&#105;&#116;"
                            className="flex items-center gap-1.5 align-middle hover:text-yellow-400 transition-colors"
                            rel="nofollow"
                        >
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                            <span className="whitespace-nowrap">&#114;&#97;&#99;&#99;&#111;&#110;&#116;&#105;&#64;&#112;&#105;&#101;&#114;&#111;&#99;&#97;&#114;&#98;&#111;&#110;&#101;&#116;&#116;&#105;&#46;&#105;&#116;</span>
                        </a>
                    </div>

                    <ThemeSwitcher />

                    {/* User Menu or Auth Button */}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 text-xs sm:text-sm">
                                    <UserCircle className="h-5 w-5" />
                                    <span className="font-medium">{state.user?.name || 'Utente'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">Impostazioni</Link>
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem asChild disabled={true}>
                                    <Link href="/my-books">La mia libreria</Link>
                                </DropdownMenuItem> */}
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