'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useTheme } from 'next-themes';
import { 
    usePreferencesStore, 
    useViewMode, 
    useLanguage, 
    useReadingPreferences,
    useReaderPreferences,
    useAccessibilityPreferences 
} from '@/stores/preferences-store';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { fontSize } from '@/app/read-book/[book_id]/OptionsSidebar';
import { CopyrightFooter } from '@/components/shared/copyright-footer';

export default function SettingsPage() {
    const { state: { user, isAuthenticated } } = useAuth();
    const router = useRouter();
    const { setTheme, theme } = useTheme();
    
    // Zustand store actions
    const {
        setViewMode,
        setLanguage,
        updateReadingPrefs,
        updateReaderPrefs,
        updateAccessibilityPrefs,
        resetPreferences,
    } = usePreferencesStore();
    
    // Zustand store values
    const viewMode = useViewMode();
    const language = useLanguage();
    const readingPrefs = useReadingPreferences();
    const readerPrefs = useReaderPreferences();
    const accessibilityPrefs = useAccessibilityPreferences();

    const [isSaving, setIsSaving] = React.useState(false);

    // Handle theme change
    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        toast({
            title: 'Tema aggiornato',
            description: 'Il tema è stato salvato correttamente.',
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

    const currentFontSize = fontSize(readingPrefs.fontSize);
    const btnHoverClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200';

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
                                                () => updateReaderPrefs({
                                                    viewMode: value as 'single' | 'double',
                                                }),
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
                                    <Label htmlFor="reader-zoom">Livello di zoom: {readerPrefs.zoomLevel}%</Label>
                                    <Slider
                                        value={[readerPrefs.zoomLevel]}
                                        onValueChange={(value) => {
                                            updateReaderPrefs({ zoomLevel: value[0] });
                                            toast({
                                                title: 'Preferenze aggiornate',
                                                description: 'Il livello di zoom è stato aggiornato.',
                                            });
                                        }}
                                        min={50}
                                        max={200}
                                        step={10}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>50%</span>
                                        <span>100%</span>
                                        <span>200%</span>
                                    </div>
                                </div>

                                {/* Hidden reading preferences for future use
                                <div className="space-y-2">
                                    <Label htmlFor="font-size">Dimensione carattere</Label>
                                    <div className="flex items-center justify-start space-x-7">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                className={`border rounded w-8 h-8 flex items-center justify-center text-base ${btnHoverClass}`}
                                                onClick={() =>
                                                    handlePreferenceChange(
                                                        () => updateReadingPrefs({
                                                            fontSize: Math.max(currentFontSize - 10, 10),
                                                        }),
                                                        'La dimensione del carattere è stata aggiornata.'
                                                    )
                                                }
                                            >
                                                A-
                                            </button>
                                            <span className="w-10 text-center text-base">{currentFontSize}%</span>
                                            <button
                                                className={`border rounded w-8 h-8 flex items-center justify-center text-base ${btnHoverClass}`}
                                                onClick={() =>
                                                    handlePreferenceChange(
                                                        () => updateReadingPrefs({
                                                            fontSize: Math.min(currentFontSize + 10, 400),
                                                        }),
                                                        'La dimensione del carattere è stata aggiornata.'
                                                    )
                                                }
                                            >
                                                A+
                                            </button>
                                        </div>
                                        <button
                                            className={`border rounded w-8 h-8 flex items-center justify-center ${btnHoverClass}`}
                                            onClick={() =>
                                                handlePreferenceChange(
                                                    () => updateReadingPrefs({
                                                        fontSize: 100,
                                                    }),
                                                    'La dimensione del carattere è stata reimpostata.'
                                                )
                                            }
                                            aria-label="Reimposta dimensione carattere"
                                        >
                                            <RefreshCw className="text-base h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="line-spacing">Spaziatura righe</Label>
                                    <Select
                                        value={readingPrefs.lineHeight}
                                        onValueChange={(value) => 
                                            handlePreferenceChange(
                                                () => updateReadingPrefs({
                                                    lineHeight: value as 'tight' | 'normal' | 'relaxed',
                                                }),
                                                'La spaziatura delle righe è stata aggiornata.'
                                            )
                                        }
                                    >
                                        <SelectTrigger id="line-spacing">
                                            <SelectValue placeholder="Seleziona spaziatura" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tight">Stretta</SelectItem>
                                            <SelectItem value="normal">Normale</SelectItem>
                                            <SelectItem value="relaxed">Rilassata</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="font-family">Font</Label>
                                    <Select
                                        value={readingPrefs.fontFamily}
                                        onValueChange={(value) => 
                                            handlePreferenceChange(
                                                () => updateReadingPrefs({
                                                    fontFamily: value,
                                                }),
                                                'Il font è stato aggiornato.'
                                            )
                                        }
                                    >
                                        <SelectTrigger id="font-family">
                                            <SelectValue placeholder="Seleziona font" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Predefinito</SelectItem>
                                            <SelectItem value="serif">Serif</SelectItem>
                                            <SelectItem value="sans-serif">Sans Serif</SelectItem>
                                            <SelectItem value="monospace">Monospace</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                */}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Accessibility Settings - Hidden but keep code */}
                    {/* <TabsContent value="accessibility">
                        <Card>
                            <CardHeader>
                                <CardTitle>Accessibilità</CardTitle>
                                <CardDescription>
                                    Opzioni per migliorare l'accessibilità dell'interfaccia
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Riduci animazioni</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Riduci le animazioni e le transizioni nell'interfaccia
                                        </p>
                                    </div>
                                    <Switch
                                        checked={accessibilityPrefs.reduceAnimations}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange(
                                                () => updateAccessibilityPrefs({
                                                    reduceAnimations: checked,
                                                }),
                                                'Le impostazioni di accessibilità sono state aggiornate.'
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Alto contrasto</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Aumenta il contrasto dei colori per migliore leggibilità
                                        </p>
                                    </div>
                                    <Switch
                                        checked={accessibilityPrefs.highContrast}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange(
                                                () => updateAccessibilityPrefs({
                                                    highContrast: checked,
                                                }),
                                                'Le impostazioni di accessibilità sono state aggiornate.'
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Testo grande</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Usa un testo più grande in tutta l'applicazione
                                        </p>
                                    </div>
                                    <Switch
                                        checked={accessibilityPrefs.largeText}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange(
                                                () => updateAccessibilityPrefs({
                                                    largeText: checked,
                                                }),
                                                'Le impostazioni di accessibilità sono state aggiornate.'
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Riduci movimento</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Riduci il movimento degli elementi nell'interfaccia
                                        </p>
                                    </div>
                                    <Switch
                                        checked={accessibilityPrefs.reducedMotion}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange(
                                                () => updateAccessibilityPrefs({
                                                    reducedMotion: checked,
                                                }),
                                                'Le impostazioni di accessibilità sono state aggiornate.'
                                            )
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent> */}
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