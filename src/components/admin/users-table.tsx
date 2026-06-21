'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Search } from 'lucide-react';
import { ADMIN_ROLE_OPTIONS, getAdminRole, type AdminRole } from '@/config/admin-roles';
import { AdminRoleIcon } from '@/components/admin/admin-role-icon';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { SITE_CONFIG } from '@/config/site-config';
import { formatDate } from '@/lib/utils';

export interface UserSummary {
    id: number;
    email: string;
    fullName: string;
    isActivated: boolean;
    isAdmin: boolean;
    userLevel: AdminRole;
    createdAt: string;
    updatedAt: string;
}

interface UsersResponse {
    users: UserSummary[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}

type SortField = 'email' | 'fullName' | 'isActivated' | 'userLevel' | 'createdAt';
type PendingRoleChange = { user: UserSummary; userLevel: AdminRole };

const ROLE_STYLES: Record<AdminRole, { badge: string; row: string }> = {
    0: {
        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
        row: '',
    },
    1: {
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
        row: 'bg-blue-50/40 dark:bg-blue-950/10',
    },
    2: {
        badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
        row: 'bg-amber-50/50 dark:bg-amber-950/15',
    },
    3: {
        badge: 'bg-yellow-300 text-yellow-950 ring-1 ring-yellow-500 dark:bg-yellow-600 dark:text-yellow-50 dark:ring-yellow-400',
        row: 'bg-yellow-100/70 dark:bg-yellow-950/25',
    },
};

async function readError(response: Response, fallback: string): Promise<string> {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    return body?.error ?? fallback;
}

async function getCsrfToken(): Promise<string> {
    const response = await fetch('/api/csrf-token');
    if (!response.ok) throw new Error('Impossibile recuperare il token CSRF');
    const body = await response.json() as { token?: string };
    if (!body.token) throw new Error('Token CSRF mancante');
    return body.token;
}

export function UsersTable({ currentUserId }: { currentUserId: number }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [page, setPage] = useState<number>(SITE_CONFIG.PAGINATION.DEFAULT_PAGE);
    const [perPage, setPerPage] = useState<number>(SITE_CONFIG.PAGINATION.DEFAULT_PER_PAGE);
    const [search, setSearch] = useState('');
    const [userLevel, setUserLevel] = useState<'all' | `${AdminRole}`>('all');
    const [sortBy, setSortBy] = useState<SortField>('userLevel');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null);

    const queryKey = ['admin-users', { page, perPage, search, userLevel, sortBy, sortOrder }] as const;
    const { data, isLoading, isFetching, error } = useQuery<UsersResponse, Error>({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                perPage: String(perPage),
                search,
                userLevel,
                sortBy,
                sortOrder,
            });
            const response = await fetch(`/api/users?${params}`);
            if (!response.ok) throw new Error(await readError(response, 'Impossibile caricare gli utenti'));
            return response.json();
        },
        placeholderData: (previousData) => previousData,
        retry: 1,
    });

    const mutation = useMutation({
        mutationFn: async ({ user, userLevel: nextLevel }: PendingRoleChange) => {
            const token = await getCsrfToken();
            const response = await fetch(`/api/users/${user.id}/role`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
                body: JSON.stringify({ userLevel: nextLevel }),
            });
            if (!response.ok) throw new Error(await readError(response, 'Impossibile aggiornare il ruolo'));
            return response.json() as Promise<{ user: UserSummary }>;
        },
        onSuccess: ({ user }) => {
            queryClient.setQueriesData<UsersResponse>({ queryKey: ['admin-users'] }, (current) => {
                if (!current) return current;
                return { ...current, users: current.users.map((item) => item.id === user.id ? user : item) };
            });
            void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({ title: 'Ruolo aggiornato', description: `${user.fullName} ora è ${getAdminRole(user.userLevel).label}.` });
            setPendingChange(null);
        },
        onError: (mutationError: Error) => {
            toast({ title: 'Errore', description: mutationError.message, variant: 'destructive' });
        },
    });

    const users = data?.users ?? [];
    const pagination = data?.pagination ?? { page, perPage, total: 0, totalPages: 1 };
    const firstResult = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.perPage + 1;
    const lastResult = Math.min(pagination.page * pagination.perPage, pagination.total);

    const SortIndicator = useMemo(() => function SortIndicator({ field }: { field: SortField }) {
        return <span className="ml-1" aria-hidden="true">{sortBy === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>;
    }, [sortBy, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortBy === field) setSortOrder((current) => current === 'asc' ? 'desc' : 'asc');
        else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setPage(1);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                        type="search"
                        placeholder="Cerca per nome o email…"
                        className="pl-9"
                        value={search}
                        onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                    />
                </div>
                <Select
                    value={userLevel}
                    onValueChange={(value: 'all' | `${AdminRole}`) => { setUserLevel(value); setPage(1); }}
                >
                    <SelectTrigger className="w-full sm:w-[210px]" aria-label="Filtra per ruolo">
                        <SelectValue placeholder="Tutti i ruoli" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutti i ruoli</SelectItem>
                        {ADMIN_ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={String(role.value)}>{role.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('email')}>Email <SortIndicator field="email" /></TableHead>
                            <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('fullName')}>Nome <SortIndicator field="fullName" /></TableHead>
                            <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => handleSort('isActivated')}>Stato <SortIndicator field="isActivated" /></TableHead>
                            <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('userLevel')}>Livello <SortIndicator field="userLevel" /></TableHead>
                            <TableHead className="cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('createdAt')}>Registrato <SortIndicator field="createdAt" /></TableHead>
                            <TableHead className="min-w-[210px]">Modifica accesso</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /><span className="sr-only">Caricamento utenti</span></TableCell></TableRow>
                        ) : error ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-destructive">{error.message}</TableCell></TableRow>
                        ) : users.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nessun utente trovato.</TableCell></TableRow>
                        ) : users.map((user) => {
                            const role = getAdminRole(user.userLevel);
                            const roleStyle = ROLE_STYLES[user.userLevel];
                            const isCurrentUser = user.id === currentUserId;
                            return (
                                <TableRow key={user.id} className={`${roleStyle.row} ${isFetching ? 'opacity-70' : ''}`}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>{user.fullName}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={user.isActivated ? 'rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200' : 'rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground'}>
                                            {user.isActivated ? 'Attivo' : 'Inattivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyle.badge}`}>
                                            <AdminRoleIcon level={user.userLevel} className="h-3.5 w-3.5" />
                                            {role.label}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={String(user.userLevel)}
                                            disabled={isCurrentUser || mutation.isPending}
                                            onValueChange={(value) => setPendingChange({ user, userLevel: Number(value) as AdminRole })}
                                        >
                                            <SelectTrigger aria-label={`Modifica il ruolo di ${user.fullName}`} title={isCurrentUser ? 'Non puoi modificare il tuo ruolo' : undefined}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ADMIN_ROLE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={String(option.value)}>
                                                        <span className="flex items-center gap-2"><AdminRoleIcon level={option.value} className="h-4 w-4" />{option.label}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">Risultati {firstResult}–{lastResult} di {pagination.total}</p>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={String(perPage)} onValueChange={(value) => { setPerPage(Number(value)); setPage(1); }}>
                        <SelectTrigger className="h-8 w-[76px]" aria-label="Righe per pagina"><SelectValue /></SelectTrigger>
                        <SelectContent>{[10, 20, 30, 40, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
                    </Select>
                    <span className="whitespace-nowrap">Pagina {pagination.page} di {pagination.totalPages}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={pagination.page === 1}><ChevronsLeft className="h-4 w-4" /><span className="sr-only">Prima pagina</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={pagination.page === 1}><ChevronLeft className="h-4 w-4" /><span className="sr-only">Pagina precedente</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} disabled={pagination.page === pagination.totalPages}><ChevronRight className="h-4 w-4" /><span className="sr-only">Pagina successiva</span></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}><ChevronsRight className="h-4 w-4" /><span className="sr-only">Ultima pagina</span></Button>
                </div>
            </div>

            <Dialog open={pendingChange !== null} onOpenChange={(open) => { if (!open && !mutation.isPending) setPendingChange(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Conferma modifica del ruolo</DialogTitle>
                        <DialogDescription>
                            {pendingChange && <>Assegnare a <strong>{pendingChange.user.fullName}</strong> il livello <strong>{getAdminRole(pendingChange.userLevel).label}</strong>?</>}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingChange(null)} disabled={mutation.isPending}>Annulla</Button>
                        <Button onClick={() => pendingChange && mutation.mutate(pendingChange)} disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Conferma
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
