'use client';

import * as React from 'react';
import Link from 'next/link';
import { Book, UserCircle, Settings, LogOut, BookOpen, Library } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface HeaderProps {
    onOpenAuth: () => void;
    className?: string;
}

export function Header({ onOpenAuth, className }: HeaderProps) {
    const { state: { user, isAuthenticated }, logout } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            className
        )}>
            <div className="container w-full flex h-16 items-center justify-between">
                {/* Logo and Brand */}
                
                <Link href="/" className="flex items-center space-x-2">
                    <Library className="h-6 w-6" />
                    <span className="font-bold">Digital Library</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link
                        href="/books"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Books
                    </Link>
                    <Link
                        href="/audiobooks"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Audiobooks
                    </Link>
                    {isAuthenticated && (
                        <Link
                            href="/my-books"
                            className="text-sm font-medium transition-colors hover:text-primary"
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
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/my-books" className="cursor-pointer">
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        <span>My Books</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onOpenAuth}
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
                        <span className="sr-only">Toggle menu</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6"
                        >
                            <line x1="4" x2="20" y1="12" y2="12" />
                            <line x1="4" x2="20" y1="6" y2="6" />
                            <line x1="4" x2="20" y1="18" y2="18" />
                        </svg>
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t">
                    <nav className="flex flex-col space-y-4 p-4">
                        <Link
                            href="/books"
                            className="text-sm font-medium transition-colors hover:text-primary"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Books
                        </Link>
                        <Link
                            href="/audiobooks"
                            className="text-sm font-medium transition-colors hover:text-primary"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Audiobooks
                        </Link>
                        {isAuthenticated && (
                            <Link
                                href="/my-books"
                                className="text-sm font-medium transition-colors hover:text-primary"
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