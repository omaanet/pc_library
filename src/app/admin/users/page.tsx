'use client';

import { useState } from 'react';
import { ArrowLeft, Crown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isSuperAdminLevel } from '@/config/admin-roles';
import { useAuth } from '@/context/auth-context';
import { AdminAccessDenied } from '@/components/auth/admin-access-denied';
import { AuthModal } from '@/components/auth/auth-modal';
import { UsersTable } from '@/components/admin/users-table';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
    const router = useRouter();
    const { state } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const isAllowed = state.isAuthenticated && isSuperAdminLevel(state.user?.userLevel);

    if (state.isLoading) {
        return (
            <div className="container mx-auto flex min-h-screen items-center justify-center p-10">
                <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Verifica autorizzazione…</div>
            </div>
        );
    }

    if (!isAllowed || !state.user) {
        return (
            <>
                <AdminAccessDenied action="gestire utenti e livelli di accesso" onAuthClick={() => setIsAuthModalOpen(true)} />
                <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
            </>
        );
    }

    return (
        <main className="container mx-auto px-4 py-6 lg:px-0">
            <div className="mb-6 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /><span className="sr-only">Indietro</span></Button>
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"><Crown className="h-6 w-6 text-yellow-500" />Gestisci Utenti</h1>
                    <p className="text-sm text-muted-foreground">Consulta gli utenti registrati e assegna i livelli di accesso amministrativo.</p>
                </div>
            </div>
            <UsersTable currentUserId={state.user.id} />
        </main>
    );
}
