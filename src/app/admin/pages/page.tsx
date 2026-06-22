'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Crown, Loader2, LockKeyhole, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ADMIN_ROLE_OPTIONS, type AdminRole } from '@/config/admin-roles';
import { sortManagedPages, type ManagedPageConfig, type ManagedPageKey } from '@/config/managed-pages';
import { AdminRoleIcon } from '@/components/admin/admin-role-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { getAdminRoleMenuClass } from '@/lib/admin-role-menu';

function normalizeOrders(pages: ManagedPageConfig[]): ManagedPageConfig[] {
    const normalized: ManagedPageConfig[] = [];
    for (const role of ADMIN_ROLE_OPTIONS) {
        pages
            .filter((page) => page.accessLevel === role.value)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .forEach((page, index) => normalized.push({ ...page, displayOrder: index + 1 }));
    }
    return sortManagedPages(normalized);
}

async function readError(response: Response, fallback: string): Promise<string> {
    try {
        const data = await response.json();
        return data.error || fallback;
    } catch {
        return fallback;
    }
}

export default function ManagePagesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [pages, setPages] = useState<ManagedPageConfig[]>([]);
    const [savedSnapshot, setSavedSnapshot] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadPages = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/pages', { cache: 'no-store' });
            if (!response.ok) throw new Error(await readError(response, 'Impossibile caricare le pagine'));
            const data = await response.json() as { pages: ManagedPageConfig[] };
            const next = sortManagedPages(data.pages);
            setPages(next);
            setSavedSnapshot(JSON.stringify(next));
        } catch (error) {
            toast({ title: 'Errore', description: error instanceof Error ? error.message : 'Caricamento non riuscito', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { void loadPages(); }, [loadPages]);

    const isDirty = useMemo(() => JSON.stringify(pages) !== savedSnapshot, [pages, savedSnapshot]);

    const changeAccessLevel = (key: ManagedPageKey, accessLevel: AdminRole) => {
        setPages((current) => {
            const targetCount = current.filter((page) => page.accessLevel === accessLevel).length;
            return normalizeOrders(current.map((page) => page.key === key
                ? { ...page, accessLevel, displayOrder: targetCount + 1 }
                : page
            ));
        });
    };

    const changeOrder = (key: ManagedPageKey, requestedOrder: number) => {
        setPages((current) => {
            const page = current.find((item) => item.key === key);
            if (!page) return current;
            const group = current.filter((item) => item.accessLevel === page.accessLevel).sort((a, b) => a.displayOrder - b.displayOrder);
            const from = group.findIndex((item) => item.key === key);
            const [moved] = group.splice(from, 1);
            group.splice(requestedOrder - 1, 0, moved);
            const orders = new Map(group.map((item, index) => [item.key, index + 1]));
            return sortManagedPages(current.map((item) => item.accessLevel === page.accessLevel
                ? { ...item, displayOrder: orders.get(item.key)! }
                : item
            ));
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            const tokenResponse = await fetch('/api/csrf-token');
            if (!tokenResponse.ok) throw new Error('Impossibile recuperare il token CSRF');
            const { token } = await tokenResponse.json() as { token: string };
            const response = await fetch('/api/admin/pages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
                body: JSON.stringify({ pages: pages.map(({ key, accessLevel, displayOrder }) => ({ key, accessLevel, displayOrder })) }),
            });
            if (!response.ok) throw new Error(await readError(response, 'Salvataggio non riuscito'));
            const data = await response.json() as { pages: ManagedPageConfig[] };
            const next = sortManagedPages(data.pages);
            setPages(next);
            setSavedSnapshot(JSON.stringify(next));
            toast({ title: 'Pagine aggiornate', description: 'Accessi e ordine del menu sono stati salvati.' });
        } catch (error) {
            toast({ title: 'Errore', description: error instanceof Error ? error.message : 'Salvataggio non riuscito', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="container mx-auto px-4 py-6 lg:px-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /><span className="sr-only">Indietro</span></Button>
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"><Crown className="h-6 w-6 text-yellow-500" />Gestisci Pagine</h1>
                        <p className="text-sm text-muted-foreground">Configura il livello minimo di accesso e l’ordine delle pagine nel menu.</p>
                    </div>
                </div>
                <Button onClick={save} disabled={!isDirty || saving || loading}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salva modifiche
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pagine del menu</CardTitle>
                    <CardDescription>Le posizioni sono progressive e indipendenti per ogni livello di accesso.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Caricamento…</div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Pagina</TableHead><TableHead>Livello minimo</TableHead><TableHead className="w-36">Posizione</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {pages.map((page) => {
                                    const groupSize = pages.filter((item) => item.accessLevel === page.accessLevel).length;
                                    return (
                                        <TableRow key={page.key}>
                                            <TableCell><div className="font-medium">{page.label}</div><div className="text-xs text-muted-foreground">{page.href}</div></TableCell>
                                            <TableCell>
                                                <Select value={String(page.accessLevel)} onValueChange={(value) => changeAccessLevel(page.key, Number(value) as AdminRole)} disabled={page.accessLevelLocked}>
                                                    <SelectTrigger className={`w-52 ${getAdminRoleMenuClass(page.accessLevel)}`}><SelectValue /></SelectTrigger>
                                                    <SelectContent>{ADMIN_ROLE_OPTIONS.map((role) => <SelectItem key={role.value} value={String(role.value)} className={getAdminRoleMenuClass(role.value)}><span className="flex items-center gap-2"><AdminRoleIcon level={role.value} className="h-4 w-4" />{role.label}</span></SelectItem>)}</SelectContent>
                                                </Select>
                                                {page.accessLevelLocked && <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><LockKeyhole className="h-3 w-3" />Livello bloccato</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Select value={String(page.displayOrder)} onValueChange={(value) => changeOrder(page.key, Number(value))}>
                                                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                                    <SelectContent>{Array.from({ length: groupSize }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>{index + 1}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
