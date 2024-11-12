// src/components/layout/root-nav.tsx
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
} from "@/components/ui/dropdown-menu";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Book,
    Library,
    Menu,
    UserCircle,
} from 'lucide-react';

interface RootNavProps {
    isAuthenticated?: boolean;
    onAuthClick?: () => void;
}

export function RootNav({ isAuthenticated, onAuthClick }: RootNavProps) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo and Brand */}
                <Link href="/" className="flex items-center space-x-2">
                    <Library className="h-6 w-6" />
                    <span className="font-bold">Digital Library</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link
                        href="/books"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary",
                            pathname === "/books" && "text-primary"
                        )}
                    >
                        Books
                    </Link>
                    <Link
                        href="/audiobooks"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary",
                            pathname === "/audiobooks" && "text-primary"
                        )}
                    >
                        Audiobooks
                    </Link>
                    {isAuthenticated && (
                        <Link
                            href="/my-books"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === "/my-books" && "text-primary"
                            )}
                        >
                            My Library
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
                                <Button variant="ghost" size="icon">
                                    <UserCircle className="h-5 w-5" />
                                    <span className="sr-only">User menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/my-books">My Books</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onAuthClick}
                        >
                            Sign In
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
                        <Link
                            href="/books"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === "/books" && "text-primary"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Books
                        </Link>
                        <Link
                            href="/audiobooks"
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === "/audiobooks" && "text-primary"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Audiobooks
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
                                My Library
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}