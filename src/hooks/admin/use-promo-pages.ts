// src/hooks/admin/use-promo-pages.ts
// Admin data hook for promo audio pages: fetch + CRUD with toast feedback.

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { PromoPage, PromoPageListItem } from '@/types';
import type { PromoTemplate } from '@/lib/promo-page-input';

export interface PromoPageInput {
    bookId: string;
    mediaId: string | null;
    audioLength: number | null;
    isActive: boolean;
    template: PromoTemplate;
    publishingDateOverride: string | null;
    audioType: string;
}

async function getCSRFToken(): Promise<string> {
    const response = await fetch('/api/csrf-token');
    if (!response.ok) {
        throw new Error('Impossibile recuperare il token CSRF');
    }
    const data = await response.json();
    return data.token as string;
}

async function readError(response: Response, fallback: string): Promise<string> {
    try {
        const data = await response.json();
        return data.error || fallback;
    } catch {
        return fallback;
    }
}

export function usePromoPages({ initialRefetch = true }: { initialRefetch?: boolean } = {}) {
    const [promoPages, setPromoPages] = useState<PromoPageListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPromoPages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/promo-pages');
            if (!response.ok) {
                throw new Error(await readError(response, `Errore nel caricamento: ${response.status}`));
            }
            const data = await response.json();
            setPromoPages(data.promoPages || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Impossibile caricare le pagine promo';
            setError(message);
            toast({ title: 'Errore', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const createPromoPage = useCallback(async (input: PromoPageInput): Promise<PromoPage | null> => {
        setLoading(true);
        try {
            const token = await getCSRFToken();
            const response = await fetch('/api/promo-pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
                body: JSON.stringify(input),
            });
            if (!response.ok) {
                throw new Error(await readError(response, `Errore nella creazione: ${response.status}`));
            }
            const created = (await response.json()) as PromoPage;
            toast({ title: 'Creata', description: 'Pagina promo creata correttamente' });
            await fetchPromoPages();
            return created;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Creazione non riuscita';
            toast({ title: 'Errore', description: message, variant: 'destructive' });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast, fetchPromoPages]);

    const updatePromoPage = useCallback(async (id: number, input: PromoPageInput): Promise<PromoPage | null> => {
        setLoading(true);
        try {
            const token = await getCSRFToken();
            const response = await fetch(`/api/promo-pages/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
                body: JSON.stringify(input),
            });
            if (!response.ok) {
                throw new Error(await readError(response, `Errore nell'aggiornamento: ${response.status}`));
            }
            const updated = (await response.json()) as PromoPage;
            toast({ title: 'Aggiornata', description: 'Pagina promo aggiornata correttamente' });
            await fetchPromoPages();
            return updated;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Aggiornamento non riuscito';
            toast({ title: 'Errore', description: message, variant: 'destructive' });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast, fetchPromoPages]);

    const deletePromoPage = useCallback(async (id: number): Promise<boolean> => {
        setLoading(true);
        try {
            const token = await getCSRFToken();
            const response = await fetch(`/api/promo-pages/${id}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': token },
            });
            if (!response.ok) {
                throw new Error(await readError(response, `Errore nell'eliminazione: ${response.status}`));
            }
            toast({ title: 'Eliminata', description: 'Pagina promo eliminata' });
            await fetchPromoPages();
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Eliminazione non riuscita';
            toast({ title: 'Errore', description: message, variant: 'destructive' });
            return false;
        } finally {
            setLoading(false);
        }
    }, [toast, fetchPromoPages]);

    useEffect(() => {
        if (initialRefetch) fetchPromoPages();
    }, [fetchPromoPages, initialRefetch]);

    return { promoPages, loading, error, fetchPromoPages, createPromoPage, updatePromoPage, deletePromoPage };
}
