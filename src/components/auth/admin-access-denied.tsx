'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminAccessDeniedProps {
    action: string; // e.g., "gestire i libri", "visualizzare le statistiche utenti"
    onAuthClick: () => void; // Opens the AuthModal
}

export function AdminAccessDenied({ action, onAuthClick }: AdminAccessDeniedProps) {
    return (
        <div className="container mx-auto p-10 flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto" />
                <h2 className="text-2xl font-semibold">Accesso Negato</h2>
                <p className="text-muted-foreground max-w-md">
                    Devi essere autenticato come amministratore per {action}.
                </p>
                <div className="space-x-2">
                    <Button onClick={onAuthClick}>
                        Accedi
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/">Torna alla Home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
