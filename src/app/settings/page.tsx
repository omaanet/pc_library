'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import {
    useBookBadgePalette,
    useReaderPreferences,
    useSetBookBadgePalette,
    useSetThemePreference,
    useSetViewMode,
    useSetZoomLevel,
    useThemePreference,
} from '@/stores/preferences-store';
import {
    BOOK_BADGE_PALETTES,
    isBookBadgePalette,
} from '@/config/book-badge-palettes';
import { RootNav } from '@/components/layout/root-nav';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, BookOpenText, Headphones, Loader2 } from 'lucide-react';
import { CopyrightFooter } from '@/components/shared/copyright-footer';

export default function SettingsPage() {
    const { state: { user, isAuthenticated } } = useAuth();
    const router = useRouter();

    // Reader preferences store actions
    const setThemePreference = useSetThemePreference();
    const setViewMode = useSetViewMode();
    const setZoomLevel = useSetZoomLevel();
    const setBookBadgePalette = useSetBookBadgePalette();

    // Reader preferences store values
    const readerPrefs = useReaderPreferences();
    const bookBadgePalette = useBookBadgePalette();
    const theme = useThemePreference();

    const [isSaving, setIsSaving] = React.useState(false);

    // Handle theme change
    const handleThemeChange = (newTheme: string) => {
        if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') return;
        setThemePreference(newTheme);
        toast({
            title: 'Tema aggiornato',
            description: 'Il tema è stato salvato correttamente.',
        });
    };

    const handleBookBadgePaletteChange = (value: string) => {
        if (!isBookBadgePalette(value)) return;

        setBookBadgePalette(value);
        toast({
            title: 'Palette aggiornata',
            description: 'I badge dei libri sono stati aggiornati.',
        });
    };

    // Handle other preference changes
    const handlePreferenceChange = async (action: () => void, description: string) => {
        setIsSaving(true);
        try {
            action();
            toast({
                title: 'Preferenze aggiornate',
                description,
            });
        } catch (error) {
            toast({
                title: 'Errore',
                description: 'Impossibile aggiornare le preferenze. Riprova.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };


    if (!user) {
        return (
            <>
                <RootNav
                    isAuthenticated={isAuthenticated}
                    onAuthClick={() => { }}
                />
                <div className="container py-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Impostazioni</CardTitle>
                            <CardDescription>
                                Effettua l'accesso per accedere alle tue impostazioni.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                {/* Footer */}
                <footer className="border-t mt-auto py-6 md:py-0">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto">
                        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                            <CopyrightFooter lang="it" detailed />
                        </p>
                    </div>
                </footer>
            </>
        );
    }

    return (
        <>
            <RootNav
                isAuthenticated={isAuthenticated}
                onAuthClick={() => { }}
            />
            <div className="container w-100 mx-auto py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="mr-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Indietro</span>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
                </div>

                <Tabs defaultValue="appearance" className="space-y-8">
                    <TabsList>
                        <TabsTrigger value="appearance">Aspetto</TabsTrigger>
                        <TabsTrigger value="reading">Lettura</TabsTrigger>
                        <TabsTrigger value="accessibility" disabled>Accessibilità</TabsTrigger>
                        <TabsTrigger value="notifications" disabled>Notifiche</TabsTrigger>
                    </TabsList>

                    {/* Appearance Settings */}
                    <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Aspetto</CardTitle>
                                <CardDescription>
                                    Personalizza l'aspetto della Biblioteca Digitale
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Tema</Label>
                                    <Select
                                        value={theme || 'system'}
                                        onValueChange={handleThemeChange}
                                    >
                                        <SelectTrigger id="theme">
                                            <SelectValue placeholder="Seleziona tema" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Chiaro</SelectItem>
                                            <SelectItem value="dark">Scuro</SelectItem>
                                            <SelectItem value="system">Sistema</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="book-badge-palette">Palette badge libri</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Scegli i colori degli indicatori di disponibilità e del badge NEW.
                                        </p>
                                    </div>
                                    <Select
                                        value={bookBadgePalette}
                                        onValueChange={handleBookBadgePaletteChange}
                                    >
                                        <SelectTrigger id="book-badge-palette">
                                            <SelectValue placeholder="Seleziona palette" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BOOK_BADGE_PALETTES.map((palette) => (
                                                <SelectItem key={palette.value} value={palette.value}>
                                                    <span
                                                        className="flex items-center gap-2"
                                                        data-book-badge-palette={palette.value}
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className="book-availability-badge-colors h-4 w-4 rounded-full ring-1 ring-inset"
                                                        />
                                                        <span
                                                            aria-hidden="true"
                                                            className="book-new-badge-colors h-4 w-4 rounded"
                                                        />
                                                        <span>{palette.label}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div
                                        className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-4"
                                        data-book-badge-palette={bookBadgePalette}
                                    >
                                        <span className="text-sm font-medium">Anteprima</span>
                                        <span className="book-availability-badge-colors flex items-center gap-2 rounded-md px-3 py-2 shadow-lg ring-1 ring-inset">
                                            <Headphones className="h-4 w-4" aria-hidden="true" />
                                            <BookOpenText className="h-4 w-4" aria-hidden="true" />
                                            <span className="text-xs font-semibold">
                                                Audio e lettura
                                            </span>
                                        </span>
                                        <span className="book-new-badge-colors rounded px-2 py-0.5 text-xs font-semibold">
                                            NEW
                                        </span>
                                    </div>
                                </div>

                                {/* Hidden but keep code for future use
                                <div className="space-y-2">
                                    <Label htmlFor="view-mode">Vista predefinita</Label>
                                    <Select
                                        value={viewMode}
                                        onValueChange={(value) => 
                                            handlePreferenceChange(
                                                () => setViewMode(value as 'grid' | 'list' | 'detailed'),
                                                'La vista è stata salvata correttamente.'
                                            )
                                        }
                                    >
                                        <SelectTrigger id="view-mode">
                                            <SelectValue placeholder="Seleziona vista" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="grid">Griglia</SelectItem>
                                            <SelectItem value="list">Lista</SelectItem>
                                            <SelectItem value="detailed">Dettagliata</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="language">Lingua</Label>
                                    <Select
                                        value={language}
                                        onValueChange={(value) => 
                                            handlePreferenceChange(
                                                () => setLanguage(value),
                                                'La lingua è stata salvata correttamente.'
                                            )
                                        }
                                    >
                                        <SelectTrigger id="language">
                                            <SelectValue placeholder="Seleziona lingua" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="it">Italiano</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                */}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Reading Settings */}
                    <TabsContent value="reading">
                        <Card>
                            <CardHeader>
                                <CardTitle>Impostazioni di lettura</CardTitle>
                                <CardDescription>
                                    Personalizza la tua esperienza di lettura
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Reader View Mode */}
                                <div className="space-y-2">
                                    <Label htmlFor="reader-view-mode">Modalità di visualizzazione</Label>
                                    <Select
                                        value={readerPrefs.viewMode}
                                        onValueChange={(value) =>
                                            handlePreferenceChange(
                                                () => setViewMode(value as 'single' | 'double'),
                                                'La modalità di visualizzazione è stata aggiornata.'
                                            )
                                        }
                                    >
                                        <SelectTrigger id="reader-view-mode">
                                            <SelectValue placeholder="Seleziona modalità" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Pagina singola</SelectItem>
                                            <SelectItem value="double">Pagina doppia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Reader Zoom Level */}
                                <div className="space-y-2">
                                    <Label htmlFor="reader-zoom">Livello di zoom: {Math.round(readerPrefs.zoomLevel * 100)}%</Label>
                                    <Slider
                                        value={[readerPrefs.zoomLevel * 100]}
                                        onValueChange={(value) => {
                                            setZoomLevel(value[0] / 100);
                                            toast({
                                                title: 'Preferenze aggiornate',
                                                description: 'Il livello di zoom è stato aggiornato.',
                                            });
                                        }}
                                        min={10}
                                        max={300}
                                        step={10}
                                        className="w-full"
                                    />
                                    <div className="relative flex w-full text-xs text-muted-foreground">
                                        <span className="absolute left-0">10%</span>
                                        <span className="absolute left-[31.65%] -translate-x-1/2">100%</span>
                                        <span className="absolute right-0">300%</span>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>

                {isSaving && (
                    <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvataggio delle modifiche...</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t mt-auto py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        <CopyrightFooter lang="it" detailed />
                    </p>
                </div>
            </footer>
        </>
    );
}
