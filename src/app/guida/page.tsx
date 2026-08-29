'use client';

import { RootNav } from '@/components/layout/root-nav';
import { GuideContent } from '@/components/guide/guide-content';
import { SiteFooter } from '@/components/shared/site-footer';
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
            <SiteFooter />
        </>
    );
}
