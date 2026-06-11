'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PromoPage, PromoPageListItem } from '@/types';
import type { PromoPageInput } from '@/hooks/admin/use-promo-pages';
import { PROMO_TEMPLATES } from '@/lib/promo-page-input';

const promoPageFormSchema = z.object({
    bookId: z.string().min(1, 'Seleziona un racconto'),
    mediaId: z.string().nullable().optional(),
    audioLength: z.number().nullable().optional(),
    isActive: z.boolean(),
    template: z.enum(PROMO_TEMPLATES),
});

const TEMPLATE_LABELS: Record<(typeof PROMO_TEMPLATES)[number], string> = {
    classic: 'Classica',
    'classic-green': 'Classica - Green',
    modern: 'Moderna',
};

type PromoPageFormValues = z.infer<typeof promoPageFormSchema>;

interface BookOption {
    id: string;
    title: string;
}

interface PromoPageFormProps {
    /** When provided, the form edits this promo page; otherwise it creates one. */
    promoPage?: PromoPageListItem | null;
    onSubmit: (values: PromoPageInput) => Promise<PromoPage | null>;
    onCancel: () => void;
}

export function PromoPageForm({ promoPage, onSubmit, onCancel }: PromoPageFormProps) {
    const isEdit = Boolean(promoPage);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [books, setBooks] = useState<BookOption[]>([]);
    const [booksLoading, setBooksLoading] = useState(false);

    const form = useForm<PromoPageFormValues>({
        resolver: zodResolver(promoPageFormSchema),
        defaultValues: {
            bookId: promoPage?.bookId ?? '',
            mediaId: promoPage?.mediaId ?? null,
            audioLength: promoPage?.audioLength ?? null,
            isActive: promoPage?.isActive ?? true,
            template: promoPage?.template ?? 'classic',
        },
    });

    // Load the list of books for the select. Needed for both creating and
    // editing, since the linked book can be changed in either mode.
    useEffect(() => {
        let cancelled = false;
        setBooksLoading(true);
        fetch('/api/books?perPage=-1&displayPreviews=-1&isVisible=-1&sortBy=title&sortOrder=asc')
            .then((res) => (res.ok ? res.json() : { books: [] }))
            .then((data) => {
                if (cancelled) return;
                const options: BookOption[] = (data.books || []).map((b: { id: string; title: string }) => ({
                    id: b.id,
                    title: b.title,
                }));
                setBooks(options);
            })
            .catch(() => {
                if (!cancelled) setBooks([]);
            })
            .finally(() => {
                if (!cancelled) setBooksLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async (values: PromoPageFormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit({
                bookId: values.bookId,
                mediaId: values.mediaId?.trim() ? values.mediaId.trim() : null,
                audioLength: values.audioLength ?? null,
                isActive: values.isActive,
                template: values.template,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="bookId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Racconto collegato</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                                disabled={booksLoading}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={booksLoading ? 'Caricamento…' : 'Seleziona un racconto'} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {books.map((book) => (
                                        <SelectItem key={book.id} value={book.id}>
                                            {book.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {isEdit
                                    ? 'Puoi cambiare il racconto collegato. Cambiandolo, lo slug (URL pubblico) viene rigenerato dal nuovo titolo.'
                                    : 'Lo slug viene generato automaticamente dal titolo del racconto.'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="mediaId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Media ID (audio promo)</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="es. la-ragazza-del-carillon.m4a"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
                            <FormDescription>
                                Nome del file audio promozionale sul CDN promo.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="audioLength"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Durata audio (secondi)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Durata in secondi"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value ? parseInt(value, 10) : null);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Template grafico</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona un template" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {PROMO_TEMPLATES.map((tpl) => (
                                        <SelectItem key={tpl} value={tpl}>
                                            {TEMPLATE_LABELS[tpl]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Design della pagina pubblica: Classica (essenziale) o Moderna (immersiva).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Pagina attiva</FormLabel>
                                <FormDescription>
                                    Se disattivata, la pagina pubblica restituisce un 404.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Annulla
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvataggio…' : isEdit ? 'Salva' : 'Crea'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
