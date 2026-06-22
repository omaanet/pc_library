'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AdminAccessDenied } from '@/components/auth/admin-access-denied';
import { AuthModal } from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePromoPages } from '@/hooks/admin/use-promo-pages';
import { PromoPagesTable } from '@/components/admin/promo-pages/promo-pages-table';
import { PromoPageForm } from '@/components/admin/promo-pages/promo-page-form';
import type { PromoPageListItem } from '@/types';

export default function AdminPromoPagesPage() {
    const router = useRouter();
    const { state } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<PromoPageListItem | null>(null);

    const {
        promoPages,
        loading,
        fetchPromoPages,
        createPromoPage,
        updatePromoPage,
        deletePromoPage,
    } = usePromoPages({ initialRefetch: false });

    const isAllowed = state.isAuthenticated;

    // Load promo pages only once the user is confirmed as power admin.
    useEffect(() => {
        if (!state.isLoading && isAllowed) {
            fetchPromoPages();
        }
    }, [state.isLoading, isAllowed, fetchPromoPages]);

    if (state.isLoading) {
        return (
            <div className="container mx-auto p-10 flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifica autorizzazione…</span>
                </div>
            </div>
        );
    }

    if (!isAllowed) {
        return (
            <>
                <AdminAccessDenied
                    action="gestire le pagine promo"
                    onAuthClick={() => setIsAuthModalOpen(true)}
                />
                <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
            </>
        );
    }

    const openCreate = () => {
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (promoPage: PromoPageListItem) => {
        setEditing(promoPage);
        setDialogOpen(true);
    };

    const handleToggleActive = async (promoPage: PromoPageListItem) => {
        await updatePromoPage(promoPage.id, {
            bookId: promoPage.bookId,
            mediaId: promoPage.mediaId,
            audioLength: promoPage.audioLength,
            isActive: !promoPage.isActive,
            template: promoPage.template,
        });
    };

    return (
        <div className="container mx-auto px-4 py-6 lg:px-0">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Indietro</span>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pagine Promo</h1>
                        <p className="text-sm text-muted-foreground">
                            Pagine pubbliche nascoste con un&apos;anteprima audio promozionale.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchPromoPages} disabled={loading}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Aggiorna
                    </Button>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuova pagina promo
                    </Button>
                </div>
            </div>

            <PromoPagesTable
                promoPages={promoPages}
                isLoading={loading}
                onEdit={openEdit}
                onDelete={deletePromoPage}
                onToggleActive={handleToggleActive}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Modifica pagina promo' : 'Nuova pagina promo'}</DialogTitle>
                    </DialogHeader>
                    <div className="px-2 pb-2 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
                        <PromoPageForm
                            promoPage={editing}
                            onCancel={() => setDialogOpen(false)}
                            onSubmit={async (values) => {
                                const result = editing
                                    ? await updatePromoPage(editing.id, {
                                        bookId: values.bookId,
                                        mediaId: values.mediaId,
                                        audioLength: values.audioLength,
                                        isActive: values.isActive,
                                        template: values.template,
                                    })
                                    : await createPromoPage(values);
                                if (result) setDialogOpen(false);
                                return result;
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
