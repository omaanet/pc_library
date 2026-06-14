'use client';

import { RootNav } from '@/components/layout/root-nav';
import { GuideContent } from '@/components/guide/guide-content';
import { CopyrightFooter } from '@/components/shared/copyright-footer';
import { useAuth } from '@/context/auth-context';

export default function GuidePage() {
    const {
        state: { isAuthenticated, isLoading },
    } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <>
            <RootNav isAuthenticated={isAuthenticated} onAuthClick={() => undefined} />
            <GuideContent />
            <footer className="mt-auto w-full border-t py-6">
                <div className="container mx-auto text-center text-sm leading-loose text-muted-foreground">
                    <CopyrightFooter lang="it" detailed />
                </div>
            </footer>
        </>
    );
}
