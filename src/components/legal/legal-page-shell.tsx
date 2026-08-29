'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';
import { RootNav } from '@/components/layout/root-nav';
import { SiteFooter } from '@/components/shared/site-footer';
import { useAuth } from '@/context/auth-context';
import { useState } from 'react';

interface LegalPageShellProps {
    children: ReactNode;
}

export function LegalPageShell({ children }: LegalPageShellProps) {
    const { state: { isAuthenticated } } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <>
            <RootNav
                isAuthenticated={isAuthenticated}
                onAuthClick={() => setIsAuthModalOpen(true)}
            />
            <main className="container mx-auto flex-1 px-4 py-10 sm:py-14">
                <div className="mx-auto max-w-4xl">
                    <Link
                        href="/"
                        className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Torna alla biblioteca
                    </Link>
                    {children}
                </div>
            </main>
            <SiteFooter />
            <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
        </>
    );
}
