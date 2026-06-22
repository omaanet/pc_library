'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { AuthModal } from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';

export function ManagedPageAccessDenied({
    isAuthenticated,
    requiredRole,
}: {
    isAuthenticated: boolean;
    requiredRole: string;
}) {
    const [authOpen, setAuthOpen] = useState(false);
    return (
        <>
            <main className="container mx-auto flex min-h-screen items-center justify-center p-10">
                <div className="space-y-4 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-orange-500" />
                    <h1 className="text-2xl font-semibold">Accesso negato</h1>
                    <p className="mx-auto max-w-md text-muted-foreground">
                        {isAuthenticated
                            ? `Questa pagina richiede il livello ${requiredRole}.`
                            : 'Devi effettuare l’accesso per visualizzare questa pagina.'}
                    </p>
                    <div className="flex justify-center gap-2">
                        {!isAuthenticated && <Button onClick={() => setAuthOpen(true)}>Accedi</Button>}
                        <Button variant="outline" asChild><Link href="/">Torna alla Home</Link></Button>
                    </div>
                </div>
            </main>
            <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
        </>
    );
}
