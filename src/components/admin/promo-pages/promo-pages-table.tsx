'use client';

import { useState } from 'react';
import { ExternalLink, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { PromoPageListItem } from '@/types';

const TEMPLATE_LABELS: Record<string, string> = {
    classic: 'Classica',
    'classic-green': 'Classica - Green',
    modern: 'Moderna',
};

interface PromoPagesTableProps {
    promoPages: PromoPageListItem[];
    isLoading: boolean;
    onEdit: (promoPage: PromoPageListItem) => void;
    onDelete: (id: number) => Promise<boolean>;
    onToggleActive: (promoPage: PromoPageListItem) => Promise<void>;
}

function formatLength(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PromoPagesTable({
    promoPages,
    isLoading,
    onEdit,
    onDelete,
    onToggleActive,
}: PromoPagesTableProps) {
    const [pendingDelete, setPendingDelete] = useState<PromoPageListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const handleToggle = async (promoPage: PromoPageListItem) => {
        setTogglingId(promoPage.id);
        try {
            await onToggleActive(promoPage);
        } finally {
            setTogglingId(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;
        setIsDeleting(true);
        try {
            const ok = await onDelete(pendingDelete.id);
            if (ok) setPendingDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Slug</TableHead>
                            <TableHead>Racconto</TableHead>
                            <TableHead className="w-[110px]">Template</TableHead>
                            <TableHead className="w-[110px]">Durata</TableHead>
                            <TableHead className="w-[110px]">Attiva</TableHead>
                            <TableHead className="w-[120px] text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && promoPages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : promoPages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nessuna pagina promo. Creane una con il pulsante in alto.
                                </TableCell>
                            </TableRow>
                        ) : (
                            promoPages.map((promoPage) => (
                                <TableRow key={promoPage.id}>
                                    <TableCell>
                                        <a
                                            href={`/promo/${promoPage.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
                                        >
                                            {promoPage.slug}
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </TableCell>
                                    <TableCell className="max-w-[280px] truncate">
                                        {promoPage.bookTitle ?? (
                                            <span className="text-muted-foreground italic">Racconto rimosso</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                promoPage.template === 'modern'
                                                    ? 'default'
                                                    : promoPage.template === 'classic-green'
                                                        ? 'outline'
                                                        : 'secondary'
                                            }
                                        >
                                            {TEMPLATE_LABELS[promoPage.template] ?? promoPage.template}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatLength(promoPage.audioLength)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={promoPage.isActive}
                                                disabled={togglingId === promoPage.id}
                                                onCheckedChange={() => handleToggle(promoPage)}
                                                aria-label="Attiva/disattiva pagina promo"
                                            />
                                            {togglingId === promoPage.id && (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(promoPage)}
                                                aria-label="Modifica"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPendingDelete(promoPage)}
                                                aria-label="Elimina"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && !isDeleting && setPendingDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminare questa pagina promo?</DialogTitle>
                        <DialogDescription>
                            La pagina {pendingDelete ? `"/promo/${pendingDelete.slug}"` : ''} verrà eliminata
                            definitivamente. Questa azione non può essere annullata.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
                            Annulla
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Elimina
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
