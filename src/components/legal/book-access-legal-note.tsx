'use client';

import { useBookAccess } from '@/context/book-access-context';

interface BookAccessLegalNoteProps {
    context: 'privacy' | 'cookies';
}

export function BookAccessLegalNote({ context }: BookAccessLegalNoteProps) {
    const { requireAuthenticationForBookAccess } = useBookAccess();

    if (context === 'cookies') {
        return requireAuthenticationForBookAccess ? (
            <p>
                <strong className="text-foreground">Configurazione attuale:</strong> la lettura online e l’ascolto
                richiedono registrazione o accesso; il cookie di sessione è quindi necessario per usare questi contenuti.
                Le pagine pubbliche restano consultabili senza cookie di autenticazione.
            </p>
        ) : (
            <p>
                <strong className="text-foreground">Configurazione attuale:</strong> lettura online e ascolto sono
                disponibili anche senza account. Il cookie di sessione viene creato soltanto se l’utente sceglie di
                registrarsi o accedere per usare funzioni personali o richiedere un PDF.
            </p>
        );
    }

    return requireAuthenticationForBookAccess ? (
        <p>
            <strong className="text-foreground">Accesso ai contenuti:</strong> nella configurazione attuale è necessario
            registrarsi o accedere per leggere online e ascoltare i racconti. Anche la richiesta di un PDF richiede un
            account. Le altre pagine pubbliche possono essere consultate senza registrazione.
        </p>
    ) : (
        <p>
            <strong className="text-foreground">Accesso ai contenuti:</strong> nella configurazione attuale i racconti
            disponibili possono essere letti online e ascoltati senza registrazione. L’account è facoltativo e serve
            soltanto per le funzioni personali scelte dall’utente; la richiesta di un PDF richiede sempre registrazione
            e accesso.
        </p>
    );
}
