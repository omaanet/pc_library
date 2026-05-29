'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Archive, ArrowLeft, CheckCircle2, Database, FileWarning, Loader2, Play, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AdminAccessDenied } from '@/components/auth/admin-access-denied';
import { AuthModal } from '@/components/auth/auth-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type PendingMigration = {
    filename: string;
    checksum: string;
    modifiedAt: string;
    size: number;
    preview: string;
};

type LatestMigrationResponse = {
    pending: boolean;
    migration: PendingMigration | null;
};

type ArchivedMigration = {
    filename: string;
    checksum: string;
    archivedAt: string;
    executedBy: number | null;
    fileExists: boolean;
    currentChecksum: string | null;
    checksumMatches: boolean | null;
    modifiedAt: string | null;
    size: number | null;
    preview: string | null;
};

type ArchivedMigrationsResponse = {
    migrations: ArchivedMigration[];
};

type RunMigrationResponse = {
    success: true;
    migration: {
        filename: string;
        checksum: string;
        executedAt: string;
        status: 'executed' | 'archived';
    };
};

async function getCSRFToken(): Promise<string> {
    const response = await fetch('/api/csrf-token');
    if (!response.ok) {
        throw new Error('Impossibile recuperare il token CSRF');
    }

    const data = await response.json();
    return data.token;
}

export default function AdminMigrationsPage() {
    const router = useRouter();
    const { state } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
    const [latest, setLatest] = React.useState<LatestMigrationResponse | null>(null);
    const [archivedMigrations, setArchivedMigrations] = React.useState<ArchivedMigration[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRunning, setIsRunning] = React.useState(false);
    const [isArchiving, setIsArchiving] = React.useState(false);
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = React.useState(false);
    const [archivedMigrationToRun, setArchivedMigrationToRun] = React.useState<ArchivedMigration | null>(null);
    const [runningArchivedFilename, setRunningArchivedFilename] = React.useState<string | null>(null);
    const [expandedArchivedFilename, setExpandedArchivedFilename] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const isAllowed =
        state.isAuthenticated &&
        state.user?.isAdmin === true &&
        (state.user?.userLevel ?? 0) > 1;

    const fetchMigrationState = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [latestResponse, archivedResponse] = await Promise.all([
                fetch('/api/admin/migrations/latest'),
                fetch('/api/admin/migrations/archived'),
            ]);
            const [latestData, archivedData] = await Promise.all([
                latestResponse.json(),
                archivedResponse.json(),
            ]);

            if (!latestResponse.ok) {
                throw new Error(latestData.error || 'Impossibile caricare le migrazioni');
            }

            if (!archivedResponse.ok) {
                throw new Error(archivedData.error || 'Impossibile caricare le migrazioni archiviate');
            }

            setLatest(latestData as LatestMigrationResponse);
            setArchivedMigrations((archivedData as ArchivedMigrationsResponse).migrations ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Impossibile caricare le migrazioni');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!state.isLoading && isAllowed) {
            fetchMigrationState();
        } else if (!state.isLoading) {
            setIsLoading(false);
        }
    }, [fetchMigrationState, isAllowed, state.isLoading]);

    const handleRunMigration = async () => {
        if (!latest?.migration) return;

        setIsRunning(true);
        setError(null);
        setSuccess(null);

        try {
            const token = await getCSRFToken();
            const response = await fetch('/api/admin/migrations/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token,
                },
                body: JSON.stringify({ filename: latest.migration.filename }),
            });
            const data = await response.json();

            if (!response.ok) {
                const details = typeof data.details === 'string' ? ` ${data.details}` : '';
                throw new Error(`${data.error || 'Migrazione non riuscita'}.${details}`.trim());
            }

            const result = data as RunMigrationResponse;
            setSuccess(`Migrazione eseguita: ${result.migration.filename}`);
            await fetchMigrationState();
        } catch (runError) {
            setError(runError instanceof Error ? runError.message : 'Migrazione non riuscita');
        } finally {
            setIsRunning(false);
        }
    };

    const handleArchiveMigration = async () => {
        if (!latest?.migration) return;

        setIsArchiving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = await getCSRFToken();
            const response = await fetch('/api/admin/migrations/archive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token,
                },
                body: JSON.stringify({ filename: latest.migration.filename }),
            });
            const data = await response.json();

            if (!response.ok) {
                const details = typeof data.details === 'string' ? ` ${data.details}` : '';
                throw new Error(`${data.error || 'Archiviazione non riuscita'}.${details}`.trim());
            }

            const result = data as RunMigrationResponse;
            setSuccess(`Migrazione archiviata: ${result.migration.filename}`);
            setIsArchiveDialogOpen(false);
            await fetchMigrationState();
        } catch (archiveError) {
            setError(archiveError instanceof Error ? archiveError.message : 'Archiviazione non riuscita');
        } finally {
            setIsArchiving(false);
        }
    };

    const handleRunArchivedMigration = async () => {
        if (!archivedMigrationToRun) return;

        const filename = archivedMigrationToRun.filename;
        setRunningArchivedFilename(filename);
        setError(null);
        setSuccess(null);

        try {
            const token = await getCSRFToken();
            const response = await fetch('/api/admin/migrations/run-archived', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token,
                },
                body: JSON.stringify({ filename }),
            });
            const data = await response.json();

            if (!response.ok) {
                const details = typeof data.details === 'string' ? ` ${data.details}` : '';
                throw new Error(`${data.error || 'Migrazione archiviata non riuscita'}.${details}`.trim());
            }

            const result = data as RunMigrationResponse;
            setSuccess(`Migrazione archiviata eseguita: ${result.migration.filename}`);
            setArchivedMigrationToRun(null);
            await fetchMigrationState();
        } catch (runError) {
            setError(runError instanceof Error ? runError.message : 'Migrazione archiviata non riuscita');
        } finally {
            setRunningArchivedFilename(null);
        }
    };

    if (state.isLoading || isLoading) {
        return (
            <div className="container mx-auto p-10 flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifica migrazioni...</span>
                </div>
            </div>
        );
    }

    if (!isAllowed) {
        return (
            <>
                <AdminAccessDenied
                    action="gestire le migrazioni del database"
                    onAuthClick={() => setIsAuthModalOpen(true)}
                />
                <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
            </>
        );
    }

    const migration = latest?.migration ?? null;

    return (
        <div className="container mx-auto px-4 py-6 lg:px-0">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Indietro</span>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Migrazioni DB</h1>
                        <p className="text-sm text-muted-foreground">Esecuzione controllata delle migrazioni SQL.</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchMigrationState}
                    disabled={isRunning || isArchiving || runningArchivedFilename !== null}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Aggiorna
                </Button>
            </div>

            <div className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Errore</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
                        <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-300" />
                        <AlertTitle>Completata</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-yellow-500" />
                            Ultima migrazione disponibile
                        </CardTitle>
                        <CardDescription>
                            {migration ? 'Migrazione pendente più recente.' : 'Nessuna migrazione pendente.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {migration ? (
                            <>
                                <div className="grid gap-3 text-sm md:grid-cols-2">
                                    <div>
                                        <div className="text-muted-foreground">File</div>
                                        <div className="font-mono font-medium">{migration.filename}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Ultima modifica</div>
                                        <div>{new Date(migration.modifiedAt).toLocaleString('it-IT')}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Dimensione</div>
                                        <div>{migration.size.toLocaleString('it-IT')} bytes</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Checksum SHA-256</div>
                                        <div className="break-all font-mono text-xs">{migration.checksum}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 text-sm font-medium text-muted-foreground">Anteprima SQL</div>
                                    <pre className="max-h-[420px] overflow-auto rounded border bg-muted p-4 text-xs leading-relaxed">
                                        {migration.preview}
                                    </pre>
                                </div>

                                <div className="flex flex-col justify-end gap-2 sm:flex-row">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsArchiveDialogOpen(true)}
                                        disabled={isRunning || isArchiving}
                                    >
                                        {isArchiving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Archive className="mr-2 h-4 w-4" />
                                        )}
                                        Archivia migrazione
                                    </Button>
                                    <Button onClick={handleRunMigration} disabled={isRunning || isArchiving}>
                                        {isRunning ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Play className="mr-2 h-4 w-4" />
                                        )}
                                        Esegui migrazione
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
                                Non ci sono migrazioni pendenti.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Archive className="h-5 w-5 text-muted-foreground" />
                            Migrazioni archiviate
                        </CardTitle>
                        <CardDescription>
                            Migrazioni nascoste dalle pendenti che possono essere eseguite manualmente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {archivedMigrations.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>File</TableHead>
                                        <TableHead>Archiviata il</TableHead>
                                        <TableHead>Dimensione</TableHead>
                                        <TableHead>Stato file</TableHead>
                                        <TableHead className="text-right">Azioni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {archivedMigrations.map((archivedMigration) => {
                                        const isExpanded = expandedArchivedFilename === archivedMigration.filename;
                                        const canRun = archivedMigration.fileExists && archivedMigration.checksumMatches === true;
                                        const isRunningArchived = runningArchivedFilename === archivedMigration.filename;

                                        return (
                                            <React.Fragment key={archivedMigration.filename}>
                                                <TableRow>
                                                    <TableCell>
                                                        <div className="max-w-[360px] break-all font-mono text-xs font-medium">
                                                            {archivedMigration.filename}
                                                        </div>
                                                        <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                                                            SHA-256: {archivedMigration.checksum}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(archivedMigration.archivedAt).toLocaleString('it-IT')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {archivedMigration.size !== null
                                                            ? `${archivedMigration.size.toLocaleString('it-IT')} bytes`
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {!archivedMigration.fileExists ? (
                                                            <Badge variant="destructive" className="gap-1">
                                                                <FileWarning className="h-3 w-3" />
                                                                File mancante
                                                            </Badge>
                                                        ) : archivedMigration.checksumMatches === false ? (
                                                            <Badge variant="destructive">Checksum diverso</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Pronta</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={!archivedMigration.preview}
                                                                onClick={() => setExpandedArchivedFilename(isExpanded ? null : archivedMigration.filename)}
                                                            >
                                                                {isExpanded ? 'Nascondi SQL' : 'Mostra SQL'}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                disabled={!canRun || isRunning || isArchiving || runningArchivedFilename !== null}
                                                                onClick={() => setArchivedMigrationToRun(archivedMigration)}
                                                            >
                                                                {isRunningArchived ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Play className="mr-2 h-4 w-4" />
                                                                )}
                                                                Esegui
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && archivedMigration.preview && (
                                                    <TableRow>
                                                        <TableCell colSpan={5}>
                                                            <pre className="max-h-[360px] overflow-auto rounded border bg-muted p-4 text-xs leading-relaxed">
                                                                {archivedMigration.preview}
                                                            </pre>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
                                Nessuna migrazione archiviata.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Archiviare questa migrazione?</DialogTitle>
                        <DialogDescription>
                            La migrazione {migration?.filename ? `"${migration.filename}"` : ''} verrà nascosta dalle migrazioni pendenti senza eseguire il suo SQL.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsArchiveDialogOpen(false)}
                            disabled={isArchiving}
                        >
                            Annulla
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleArchiveMigration}
                            disabled={isArchiving}
                        >
                            {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Archivia migrazione
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={archivedMigrationToRun !== null}
                onOpenChange={(open) => {
                    if (!open && runningArchivedFilename === null) {
                        setArchivedMigrationToRun(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eseguire questa migrazione archiviata?</DialogTitle>
                        <DialogDescription>
                            La migrazione {archivedMigrationToRun?.filename ? `"${archivedMigrationToRun.filename}"` : ''} verrà eseguita sul database e segnata come eseguita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setArchivedMigrationToRun(null)}
                            disabled={runningArchivedFilename !== null}
                        >
                            Annulla
                        </Button>
                        <Button
                            type="button"
                            onClick={handleRunArchivedMigration}
                            disabled={runningArchivedFilename !== null}
                        >
                            {runningArchivedFilename !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Esegui migrazione
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
