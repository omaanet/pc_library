'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
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
    const {
        preferences,
        isLoading,
        updatePreference,
        error
    } = useUserPreferences();

    const btnHoverClass = preferences.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200';
    const currentFontSize = fontSize(preferences.reading?.fontSize);

    const [isSaving, setIsSaving] = React.useState(false);

    const handlePreferenceChange = async <K extends keyof typeof preferences>(
        key: K,
        value: (typeof preferences)[K]
    ) => {
        setIsSaving(true);
        try {
            await updatePreference(key, value);
            toast({
                title: 'Preferences updated',
                description: 'Your settings have been saved successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update preferences. Please try again.',
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
                                        value={preferences.theme}
                                        onValueChange={(value) =>
                                            handlePreferenceChange('theme', value as typeof preferences.theme)
                                        }
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
                                {/* <div className="space-y-2">
                                    <Label htmlFor="view-mode">Vista predefinita</Label>
                                    <Select
                                        value={preferences.viewMode}
                                        onValueChange={(value) =>
                                            handlePreferenceChange('viewMode', value as typeof preferences.viewMode)
                                        }
                                    >
                                        <SelectTrigger id="view-mode">
                                            <SelectValue placeholder="Seleziona vista" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="grid">Griglia</SelectItem>
                                            <SelectItem value="list">Lista</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div> */}
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
                                <div className="space-y-2">
                                    <Label htmlFor="font-size">Dimensione carattere</Label>
                                    <div className="flex items-center justify-start space-x-7">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                className={`border rounded w-8 h-8 flex items-center justify-center text-base ${btnHoverClass}`}
                                                onClick={() =>
                                                    handlePreferenceChange('reading', {
                                                        ...preferences.reading,
                                                        fontSize: Math.max(currentFontSize - 10, 10),
                                                    })
                                                }
                                            >
                                                A-
                                            </button>
                                            <span className="w-10 text-center text-base">{currentFontSize}%</span>
                                            <button
                                                className={`border rounded w-8 h-8 flex items-center justify-center text-base ${btnHoverClass}`}
                                                onClick={() =>
                                                    handlePreferenceChange('reading', {
                                                        ...preferences.reading,
                                                        fontSize: Math.min(currentFontSize + 10, 400),
                                                    })
                                                }
                                            >
                                                A+
                                            </button>
                                        </div>
                                        <button
                                            className={`border rounded w-8 h-8 flex items-center justify-center ${btnHoverClass}`}
                                            onClick={() =>
                                                handlePreferenceChange('reading', {
                                                    ...preferences.reading,
                                                    fontSize: currentFontSize,
                                                })
                                            }
                                            aria-label="Reimposta dimensione carattere"
                                        >
                                            <RefreshCw className="text-base h-4 w-4" />
                                        </button>
                                    </div>
                                    {/* <Select
                                        value={preferences.reading.fontSize}
                                        onValueChange={(value) =>
                                            handlePreferenceChange('reading', {
                                                ...preferences.reading,
                                                fontSize: value as typeof preferences.reading.fontSize,
                                            })
                                        }
                                    >
                                        <SelectTrigger id="font-size">
                                            <SelectValue placeholder="Select font size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                            <SelectItem value="x-large">Extra Large</SelectItem>
                                        </SelectContent>
                                    </Select> */}
                                </div>
                                {/* <div className="space-y-2">
                                    <Label htmlFor="line-spacing">Line Spacing</Label>
                                    <Select
                                        value={preferences.reading.lineSpacing}
                                        onValueChange={(value) =>
                                            handlePreferenceChange('reading', {
                                                ...preferences.reading,
                                                lineSpacing: value as typeof preferences.reading.lineSpacing,
                                            })
                                        }
                                    >
                                        <SelectTrigger id="line-spacing">
                                            <SelectValue placeholder="Select line spacing" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tight">Tight</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="relaxed">Relaxed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="font-family">Font Family</Label>
                                    <Select
                                        value={preferences.reading.fontFamily}
                                        onValueChange={(value) =>
                                            handlePreferenceChange('reading', {
                                                ...preferences.reading,
                                                fontFamily: value as typeof preferences.reading.fontFamily,
                                            })
                                        }
                                    >
                                        <SelectTrigger id="font-family">
                                            <SelectValue placeholder="Select font family" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inter">Inter</SelectItem>
                                            <SelectItem value="merriweather">Merriweather</SelectItem>
                                            <SelectItem value="roboto">Roboto</SelectItem>
                                            <SelectItem value="openDyslexic">OpenDyslexic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div> */}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notification Settings */}
                    {/* <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Settings</CardTitle>
                                <CardDescription>
                                    Manage your email notification preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>New Releases</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified about new books in your favorite genres
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.emailNotifications.newReleases}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange('emailNotifications', {
                                                ...preferences.emailNotifications,
                                                newReleases: checked,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Reading Reminders</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive reminders to continue reading your books
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.emailNotifications.readingReminders}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange('emailNotifications', {
                                                ...preferences.emailNotifications,
                                                readingReminders: checked,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Book Recommendations</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get personalized book recommendations
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.emailNotifications.recommendations}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange('emailNotifications', {
                                                ...preferences.emailNotifications,
                                                recommendations: checked,
                                            })
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent> */}
                </Tabs>

                {(isLoading || isSaving) && (
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