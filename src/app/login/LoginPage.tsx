'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth/auth-modal';

function getSafeRedirectPath(redirect: string | null): string {
    if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
        return '/';
    }

    return redirect;
}

export function LoginPage({
    redirect,
    defaultTab,
}: {
    redirect?: string;
    defaultTab: 'login' | 'register';
}) {
    const router = useRouter();
    const hasAuthenticated = useRef(false);
    const redirectTo = getSafeRedirectPath(redirect ?? null);

    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <AuthModal
                open
                defaultTab={defaultTab}
                onOpenChange={(open) => {
                    if (!open && !hasAuthenticated.current) router.replace('/');
                }}
                onLoginSuccess={() => {
                    hasAuthenticated.current = true;
                    router.replace(redirectTo);
                }}
            />
        </main>
    );
}
