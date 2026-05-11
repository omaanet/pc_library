'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AdminAccessDenied } from '@/components/auth/admin-access-denied';
import { AuthModal } from '@/components/auth/auth-modal';
import { AnimationManager } from '@/components/admin/animations/animation-manager';

export default function AnimationsManagerPage() {
    const router = useRouter();
    const { state } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Redirect non-admins (or non-level-2 admins) once auth resolves
    useEffect(() => {
        if (state.isLoading) return;
        const allowed =
            state.isAuthenticated &&
            state.user?.isAdmin &&
            (state.user?.userLevel ?? 0) > 1;
        if (!allowed) {
            // The access-denied screen renders below; we don't auto-redirect
            // so unauthenticated users still get a chance to log in.
        }
    }, [state.isAuthenticated, state.user, state.isLoading, router]);

    if (state.isLoading) {
        return (
            <div className="container mx-auto p-10 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Verifica autorizzazione...</p>
                </div>
            </div>
        );
    }

    const isAllowed =
        state.isAuthenticated &&
        state.user?.isAdmin &&
        (state.user?.userLevel ?? 0) > 1;

    if (!isAllowed) {
        return (
            <>
                <AdminAccessDenied
                    action="gestire le animazioni del personaggio"
                    onAuthClick={() => setIsAuthModalOpen(true)}
                />
                <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
            </>
        );
    }

    return <AnimationManager />;
}
