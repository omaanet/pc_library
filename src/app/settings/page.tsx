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
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>
                                Please sign in to access your settings.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                {/* Footer */}
                <footer className="border-t mt-auto py-6 md:py-0">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto">
                        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                            &copy; {new Date().getFullYear()} OMAA.net - All rights reserved.
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
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
                </div>

                <Tabs defaultValue="appearance" className="space-y-8">
                    <TabsList>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="reading">Reading</TabsTrigger>
                        <TabsTrigger value="accessibility" disabled>Accessibility</TabsTrigger>
                        <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
                    </TabsList>

                    {/* Appearance Settings */}
                    <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>
                                    Customize how the Digital Library looks
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Theme</Label>
                                    <Select
                                        value={preferences.theme}
                                        onValueChange={(value) =>
                                            handlePreferenceChange('theme', value as typeof preferences.theme)
                                        }
                                    >
                                        <SelectTrigger id="theme">
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="view-mode">Default View Mode</Label>
                                    <Select
                                        value={preferences.viewMode}
                                        onValueChange={(value) =>
                                            handlePreferenceChange('viewMode', value as typeof preferences.viewMode)
                                        }
                                    >
                                        <SelectTrigger id="view-mode">
                                            <SelectValue placeholder="Select view mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="grid">Grid</SelectItem>
                                            <SelectItem value="list">List</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Accessibility Settings */}
                    {/* <TabsContent value="accessibility">
                        <Card>
                            <CardHeader>
                                <CardTitle>Accessibility</CardTitle>
                                <CardDescription>
                                    Make the Digital Library easier to use
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Reduce Animations</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Minimize motion effects throughout the interface
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences?.accessibility?.reduceAnimations || false}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange('accessibility', {
                                                ...(preferences?.accessibility || {}),
                                                reduceAnimations: checked,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>High Contrast</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Increase contrast for better readability
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences?.accessibility?.highContrast || false}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange('accessibility', {
                                                ...(preferences?.accessibility || {}),
                                                highContrast: checked,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Large Text</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Increase text size throughout the interface
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences?.accessibility?.largeText || false}
                                        onCheckedChange={(checked) =>
                                            handlePreferenceChange('accessibility', {
                                                ...(preferences?.accessibility || {}),
                                                largeText: checked,
                                            })
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent> */}

                    {/* Reading Settings */}
                    <TabsContent value="reading">
                        <Card>
                            <CardHeader>
                                <CardTitle>Reading Settings</CardTitle>
                                <CardDescription>
                                    Customize your reading experience
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="font-size">Font Size</Label>
                                    <div className="flex items-center justify-start space-x-7">
                                        <div className="flex items-center space-x-4">
                                            <button
                                                className={`border rounded w-8 h-8 flex items-center justify-center text-base ${btnHoverClass}`}
                                                onClick={() =>
                                                    handlePreferenceChange('reading', {
                                                        ...preferences.reading,
                                                        fontSize: Math.max(preferences.reading.fontSize - 10, 10),
                                                    })
                                                }
                                            >
                                                A-
                                            </button>
                                            <span className="w-10 text-center text-base">{preferences.reading.fontSize}%</span>
                                            <button
                                                className={`border rounded w-8 h-8 flex items-center justify-center text-base ${btnHoverClass}`}
                                                onClick={() =>
                                                    handlePreferenceChange('reading', {
                                                        ...preferences.reading,
                                                        fontSize: preferences.reading.fontSize + 10,
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
                                                    fontSize: 100,
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
                        <span>Saving changes...</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t mt-auto py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        &copy; {new Date().getFullYear()} OMAA.net - All rights reserved.
                    </p>
                </div>
            </footer>
        </>
    );
}