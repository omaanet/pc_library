'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookForm } from '@/components/admin/books/book-form';
import { BookTable } from '@/components/admin/books/book-table';
import { AudioTrackForm } from '@/components/admin/books/audio-track-form';
import { UsersTable } from '@/components/admin/users-table';
import { useBooks } from '@/hooks/admin/use-books';
import { Book } from '@/types';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { StatsCard, ActivityChart, TopListCard, BarChartComponent } from '@/components/statistics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, BookOpen, Users, AlertTriangle, TrendingUp, Activity, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';
import { fetchStatisticsWithErrors, retryEndpoint, type StatisticsResults, type StatisticsError } from '@/lib/statistics-error-helper';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminAccessDenied } from '@/components/auth/admin-access-denied';
import { AuthModal } from '@/components/auth/auth-modal';

export default function UserStatisticsPage() {
    const router = useRouter();
    const { state } = useAuth();
    const [timeRange, setTimeRange] = useState('all');
    const [topListSize, setTopListSize] = useState('10');
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [language, setLanguage] = useState<'en' | 'it'>('it');
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem('user-statistics-lang');
        if (saved === 'en' || saved === 'it') {
            setLanguage(saved);
        }
    }, []);
    
    const translations = React.useMemo(() => ({
        en: {
            // Authorization and loading
            checkingAuth: 'Checking authorization...',
            loadingStats: 'Loading statistics...',
            
            // Page header
            pageTitle: 'User Statistics',
            backToHome: 'Go Back to Home',
            back: 'Back',
            
            // Time range options
            selectTimeRange: 'Select time range',
            last7Days: 'Last 7 days',
            last30Days: 'Last 30 days',
            last90Days: 'Last 90 days',
            last365Days: 'Last 365 days',
            allData: 'All data',
            
            // Top list options
            top: 'Top',
            top5: 'Top 5',
            top10: 'Top 10',
            top50: 'Top 50',
            all: 'All',
            
            // Error messages
            failedToLoad: 'Failed to load statistics',
            retry: 'Retry',
            someEndpointsFailed: 'Some endpoints failed to load',
            errorsCount: 'errors',
            successfullyLoaded: 'Successfully loaded',
            failedToRetry: 'Failed to retry',
            
            // Stats cards
            totalDownloads: 'Total Downloads',
            uniqueUsers: 'unique users',
            readingSessions: 'Reading Sessions',
            uniqueReaders: 'unique readers',
            activeUsers: 'Active Users',
            totalActions: 'total actions',
            systemErrors: 'System Errors',
            errorsWarnings: 'errors, warnings',
            
            // Tabs
            overview: 'Overview',
            downloads: 'Downloads',
            reading: 'Reading',
            users: 'Users',
            errorsTab: 'Errors',
            
            // Charts and descriptions
            downloadTrends: 'Download Trends',
            downloadTrendsDesc: 'Daily downloads and unique users',
            readingActivity: 'Reading Activity',
            readingActivityDesc: 'Daily reading sessions and unique readers',
            mostDownloadedBooks: 'Most Downloaded Books',
            mostReadBooks: 'Most Read Books',
            downloadsLabel: 'downloads',
            sessionsLabel: 'sessions',
            
            // Downloads section
            downloadStatistics: 'Download Statistics',
            totalDownloadsLabel: 'Total Downloads:',
            uniqueUsersLabel: 'Unique Users:',
            uniqueBooks: 'Unique Books:',
            totalSize: 'Total Size:',
            topDownloaders: 'Top Downloaders',
            
            // Reading section
            readingActivityByHour: 'Reading Activity by Hour',
            readingActivityByHourDesc: 'Number of reading sessions per hour of day',
            topReaders: 'Top Readers',
            books: 'books',
            
            // Users section
            dailyActiveUsers: 'Daily Active Users',
            dailyActiveUsersDesc: 'Number of unique users per day',
            userEngagementDistribution: 'User Engagement Distribution',
            mostActiveUsers: 'Most Active Users',
            actions: 'actions',
            booksDownloaded: 'downloads',
            booksRead: 'books read',
            
            // Errors section
            errorTrends: 'Error Trends',
            errorTrendsDesc: 'Daily errors and warnings',
            topErrorSources: 'Top Error Sources',
            errorsLabel: 'errors',
            warningsLabel: 'avvisi',
            
            // Units
            bytes: ['Bytes', 'KB', 'MB', 'GB']
        },
        it: {
            // Authorization and loading
            checkingAuth: 'Verifica autorizzazione...',
            loadingStats: 'Caricamento statistiche...',
            
            // Page header
            pageTitle: 'Statistiche Utenti',
            backToHome: 'Torna alla Home',
            back: 'Indietro',
            
            // Time range options
            selectTimeRange: 'Seleziona intervallo di tempo',
            last7Days: 'Ultimi 7 giorni',
            last30Days: 'Ultimi 30 giorni',
            last90Days: 'Ultimi 90 giorni',
            last365Days: 'Ultimi 365 giorni',
            allData: 'Tutti i dati',
            
            // Top list options
            top: 'Top',
            top5: 'Top 5',
            top10: 'Top 10',
            top50: 'Top 50',
            all: 'Tutti',
            
            // Error messages
            failedToLoad: 'Impossibile caricare le statistiche',
            retry: 'Riprova',
            someEndpointsFailed: 'Alcuni endpoint non hanno caricato',
            errorsCount: 'errori',
            successfullyLoaded: 'Caricato con successo',
            failedToRetry: 'Impossibile riprovare',
            
            // Stats cards
            totalDownloads: 'Download Totali',
            uniqueUsers: 'utenti unici',
            readingSessions: 'Sessioni di Lettura',
            uniqueReaders: 'lettori unici',
            activeUsers: 'Utenti Attivi',
            totalActions: 'azioni totali',
            systemErrors: 'Errori di Sistema',
            errorsWarnings: 'errori, avvisi',
            
            // Tabs
            overview: 'Panoramica',
            downloads: 'Download',
            reading: 'Lettura',
            users: 'Utenti',
            errorsTab: 'Errori',
            
            // Charts and descriptions
            downloadTrends: 'Tendenze Download',
            downloadTrendsDesc: 'Download giornalieri e utenti unici',
            readingActivity: 'Attività di Lettura',
            readingActivityDesc: 'Sessioni di lettura giornaliere e lettori unici',
            mostDownloadedBooks: 'Libri più Scaricati',
            mostReadBooks: 'Libri più Letti',
            downloadsLabel: 'download',
            sessionsLabel: 'sessioni',
            
            // Downloads section
            downloadStatistics: 'Statistiche Download',
            totalDownloadsLabel: 'Download Totali:',
            uniqueUsersLabel: 'Utenti Unici:',
            uniqueBooks: 'Libri Unici:',
            totalSize: 'Dimensione Totale:',
            topDownloaders: 'Top Downloader',
            
            // Reading section
            readingActivityByHour: 'Attività di Lettura per Ora',
            readingActivityByHourDesc: 'Numero di sessioni di lettura per ora del giorno',
            topReaders: 'Top Lettori',
            books: 'libri',
            
            // Users section
            dailyActiveUsers: 'Utenti Attivi Giornalieri',
            dailyActiveUsersDesc: 'Numero di utenti unici per giorno',
            userEngagementDistribution: 'Distribuzione Engagement Utenti',
            mostActiveUsers: 'Utenti più Attivi',
            actions: 'azioni',
            booksDownloaded: 'download',
            booksRead: 'libri letti',
            
            // Errors section
            errorTrends: 'Tendenze Errori',
            errorTrendsDesc: 'Errori e avvisi giornalieri',
            topErrorSources: 'Fonti Errori Top',
            errorsLabel: 'errori',
            warningsLabel: 'avvisi',
            
            // Units
            bytes: ['Bytes', 'KB', 'MB', 'GB']
        }
    }), []);
    
    const handleLanguageChange = useCallback((newLang: 'en' | 'it') => {
        setLanguage(newLang);
        localStorage.setItem('user-statistics-lang', newLang);
    }, []);

    const t = useCallback((key: string): string => {
        const value = (translations as any)[language][key];
        return Array.isArray(value) ? value[0] : (value || key);
    }, [language, translations]);
    
    const getBytes = useCallback((): string[] => {
        return (translations as any)[language].bytes as string[];
    }, [language, translations]);
    
    const [statistics, setStatistics] = useState<{
        downloads: any;
        readingSessions: any;
        popularBooks: any;
        userActivity: any;
        errors: any;
    } | null>(null);
    const [failedEndpoints, setFailedEndpoints] = useState<StatisticsError[]>([]);
    const { toast } = useToast();

    // Fetch statistics data
    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const results = await fetchStatisticsWithErrors(timeRange, topListSize, (message, type) => {
            toast({
                title: type === 'error' ? 'Error' : 'Success',
                description: message,
                variant: type === 'error' ? 'destructive' : 'default'
            });
            });

            setStatistics({
                downloads: results.downloads,
                readingSessions: results.readingSessions,
                popularBooks: results.popularBooks,
                userActivity: results.userActivity,
                errors: results.errors
            });
            setFailedEndpoints(results.failedEndpoints);
        } catch (err) {
            setError(t('failedToLoad'));
            console.error('Error fetching statistics:', err);
        } finally {
            setLoading(false);
        }
    }, [timeRange, topListSize, toast, t]);

    // Retry a specific endpoint
    const handleRetryEndpoint = async (endpointName: string) => {
        const result = await retryEndpoint(endpointName, timeRange, topListSize);
        
        if (result.success) {
            // Update the statistics with the successful retry
            setStatistics(prev => ({
                downloads: prev?.downloads,
                readingSessions: prev?.readingSessions,
                popularBooks: prev?.popularBooks,
                userActivity: prev?.userActivity,
                errors: prev?.errors,
                [endpointName]: result.data
            }));
            
            // Remove from failed endpoints
            setFailedEndpoints(prev => 
                prev.filter(e => e.endpoint !== endpointName)
            );
            
            toast({
                title: 'Success',
                description: `${t('successfullyLoaded')} ${endpointName}`,
            });
        } else {
            toast({
                title: 'Error',
                description: `${t('failedToRetry')} ${endpointName}: ${result.error?.error}`,
                variant: 'destructive'
            });
        }
    };

    useEffect(() => {
        if (state.isAuthenticated && state.user?.isAdmin) {
            fetchStatistics();
        }
    }, [timeRange, topListSize, state.isAuthenticated, state.user?.isAdmin]); // Removed fetchStatistics from dependencies to break the loop

    // Show loading state while checking authentication or mounting
    if (state.isLoading || !isMounted) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">{t('checkingAuth')}</p>
                </div>
            </div>
        );
    }

    // Don't render content if not authorized (only after loading is complete)
    if (!state.isAuthenticated || !state.user?.isAdmin) {
        return (
            <>
                <AdminAccessDenied 
                    action="visualizzare le statistiche utenti" 
                    onAuthClick={() => setIsAuthModalOpen(true)}
                />
                <AuthModal
                    open={isAuthModalOpen}
                    onOpenChange={setIsAuthModalOpen}
                />
            </>
        );
    }

    // Show initial loading screen only when there's no data yet
    if (loading && !statistics) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">{t('loadingStats')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-10">
                <div className="text-center">
                    <p className="text-lg text-red-600">{error}</p>
                    <Button onClick={fetchStatistics} className="mt-4">
                        {t('retry')}
                    </Button>
                </div>
            </div>
        );
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = getBytes();
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="container mx-auto px-2 sm:px-4 lg:px-0 py-2 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="mr-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">{t('back')}</span>
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-[80px] sm:w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">EN</SelectItem>
                            <SelectItem value="it">IT</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[140px] sm:w-[180px]">
                            <SelectValue placeholder={t('selectTimeRange')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">{t('last7Days')}</SelectItem>
                            <SelectItem value="30">{t('last30Days')}</SelectItem>
                            <SelectItem value="90">{t('last90Days')}</SelectItem>
                            <SelectItem value="365">{t('last365Days')}</SelectItem>
                            <SelectItem value="all">{t('allData')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={topListSize} onValueChange={setTopListSize}>
                        <SelectTrigger className="w-[120px] sm:w-[120px]">
                            <SelectValue placeholder={t('top')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">{t('top5')}</SelectItem>
                            <SelectItem value="10">{t('top10')}</SelectItem>
                            <SelectItem value="50">{t('top50')}</SelectItem>
                            <SelectItem value="all">{t('all')}</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* <Button asChild variant="outline" size="sm" className="hidden sm:flex flex-shrink-0">
                        <Link href="/" className="select-none">
                            {t('backToHome')}
                        </Link>
                    </Button> */}
                </div>
            </div>

            {/* Error Summary */}
            {failedEndpoints.length > 0 && (
                <Alert className="mb-4 sm:mb-6 border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <AlertDescription className="space-y-2">
                        <div className="font-medium text-orange-800">
                            {t('someEndpointsFailed')} ({failedEndpoints.length} {t('errorsLabel')})
                        </div>
                        <div className="space-y-1">
                            {failedEndpoints.map((error, index) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-start sm:justify-between text-sm gap-2">
                                    <span className="text-orange-700">
                                        <strong>{error.endpoint}</strong>: {error.error}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRetryEndpoint(error.endpoint)}
                                        className="ml-0 sm:ml-2 h-6 px-2 text-xs self-end"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        {t('retry')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Overview Cards */}
            <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
                <StatsCard
                    title={t('totalDownloads')}
                    value={statistics?.downloads?.totalStats?.total_downloads?.toLocaleString('it-IT') || '0'}
                    description={`${statistics?.downloads?.totalStats?.unique_users || 0} ${t('uniqueUsers')}`}
                    icon={<Download className="h-4 w-4 text-blue-500" />}
                />
                <StatsCard
                    title={t('readingSessions')}
                    value={statistics?.readingSessions?.totalStats?.total_sessions?.toLocaleString('it-IT') || '0'}
                    description={`${statistics?.readingSessions?.totalStats?.unique_readers || 0} ${t('uniqueReaders')}`}
                    icon={<BookOpen className="h-4 w-4 text-amber-500" />}
                />
                <StatsCard
                    title={t('activeUsers')}
                    value={statistics?.userActivity?.overallStats?.unique_active_users?.toLocaleString('it-IT') || '0'}
                    description={`${statistics?.userActivity?.overallStats?.total_actions?.toLocaleString('it-IT') || 0} ${t('totalActions')}`}
                    icon={<Users className="h-4 w-4 text-purple-500" />}
                />
                <StatsCard
                    title={t('systemErrors')}
                    value={statistics?.errors?.overallStats?.total_errors?.toLocaleString('it-IT') || '0'}
                    description={`${statistics?.errors?.overallStats?.errors || 0} ${t('errorsCount')}, ${statistics?.errors?.overallStats?.warnings || 0} ${t('warningsLabel')}`}
                    icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="w-full overflow-x-auto flex flex-nowrap whitespace-nowrap scrollbar-hide">
                    <TabsTrigger value="overview" className="flex-shrink-0">{t('overview')}</TabsTrigger>
                    <TabsTrigger value="downloads" className="flex-shrink-0">{t('downloads')}</TabsTrigger>
                    <TabsTrigger value="reading" className="flex-shrink-0 data-[state=inactive]:bg-amber-700/50 dark:data-[state=active]:bg-amber-600/50">{t('reading')}</TabsTrigger>
                    <TabsTrigger value="users" className="flex-shrink-0">{t('users')}</TabsTrigger>
                    <TabsTrigger value="errors" className="flex-shrink-0">{t('errorsTab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                        <ActivityChart
                            data={statistics?.downloads?.downloadsOverTime || []}
                            lines={[
                                { dataKey: 'downloads_count', name: t('downloadsLabel'), color: '#8884d8' },
                                { dataKey: 'unique_users', name: t('uniqueUsers'), color: '#82ca9d' }
                            ]}
                            title={t('downloadTrends')}
                            description={t('downloadTrendsDesc')}
                        />
                        <ActivityChart
                            data={statistics?.readingSessions?.sessionsOverTime || []}
                            lines={[
                                { dataKey: 'sessions_count', name: t('sessionsLabel'), color: '#ffc658' },
                                { dataKey: 'unique_readers', name: t('uniqueReaders'), color: '#ff7c7c' }
                            ]}
                            title={t('readingActivity')}
                            description={t('readingActivityDesc')}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <TopListCard
                            title={t('mostDownloadedBooks')}
                            data={(statistics?.downloads?.mostDownloadedBooks || []).map((book: any) => ({
                                name: book.book_title,
                                value: book.download_count,
                                subtitle: `${book.unique_downloaders} ${t('uniqueUsers')}`
                            }))}
                            valueLabel={t('downloadsLabel')}
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                        <TopListCard
                            title={t('mostReadBooks')}
                            data={(statistics?.readingSessions?.mostReadBooks || []).map((book: any) => ({
                                name: book.book_title,
                                value: book.read_sessions,
                                subtitle: `${book.unique_readers} ${t('uniqueReaders')}`
                            }))}
                            valueLabel={t('sessionsLabel')}
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="downloads" className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('downloadStatistics')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span>{t('totalDownloadsLabel')}</span>
                                    <span className="font-semibold">{statistics?.downloads?.totalStats?.total_downloads?.toLocaleString('it-IT') || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('uniqueUsersLabel')}</span>
                                    <span className="font-semibold">{statistics?.downloads?.totalStats?.unique_users?.toLocaleString('it-IT') || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('uniqueBooks')}:</span>
                                    <span className="font-semibold">{statistics?.downloads?.totalStats?.unique_books?.toLocaleString('it-IT') || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('totalSize')}:</span>
                                    <span className="font-semibold">{formatBytes(statistics?.downloads?.totalStats?.total_bytes_downloaded || 0)}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <TopListCard
                            title={t('topDownloaders')}
                            data={(statistics?.downloads?.topDownloaders || []).map((user: any) => ({
                                name: user.full_name,
                                value: user.download_count,
                                subtitle: user.email
                            }))}
                            valueLabel={t('downloadsLabel')}
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="reading" className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                        <BarChartComponent
                            data={(statistics?.readingSessions?.sessionsByHour || []).map((hour: any) => ({
                                name: `${hour.hour_of_day}:00`,
                                value: hour.sessions_count
                            }))}
                            title={t('readingActivityByHour')}
                            description={t('readingActivityByHourDesc')}
                            color="#ffc658"
                        />
                        <TopListCard
                            title={t('topReaders')}
                            data={(statistics?.readingSessions?.topReaders || []).map((user: any) => ({
                                name: user.full_name,
                                value: user.reading_sessions,
                                subtitle: `${user.unique_books_read} ${t('books')}`
                            }))}
                            valueLabel={t('sessionsLabel')}
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                        <ActivityChart
                            data={statistics?.userActivity?.dailyActiveUsers || []}
                            lines={[
                                { dataKey: 'daily_active_users', name: t('activeUsers'), color: '#8884d8' }
                            ]}
                            title={t('dailyActiveUsers')}
                            description={t('dailyActiveUsersDesc')}
                        />
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('userEngagementDistribution')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {(statistics?.userActivity?.engagementDistribution || []).map((segment: any) => (
                                        <div key={segment.engagement_level} className="flex justify-between items-center">
                                            <span>{segment.engagement_level}:</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-20 bg-muted rounded-full h-2">
                                                    <div 
                                                        className="bg-primary h-2 rounded-full" 
                                                        style={{ width: `${segment.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium min-w-[3rem] text-right">
                                                    {segment.user_count} ({segment.percentage}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <TopListCard
                        title={t('mostActiveUsers')}
                        data={(statistics?.userActivity?.mostActiveUsers || []).map((user: any) => ({
                            name: user.full_name,
                            value: user.total_actions,
                            subtitle: `${user.books_downloaded} ${t('booksDownloaded')}, ${user.books_read} ${t('booksRead')}`
                        }))}
                        valueLabel={t('actions')}
                        maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                    />
                </TabsContent>

                <TabsContent value="errors" className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                        <ActivityChart
                            data={statistics?.errors?.errorsOverTime || []}
                            lines={[
                                { dataKey: 'errors', name: t('errorsTab'), color: '#ff7c7c' },
                                { dataKey: 'warnings', name: t('warningsLabel'), color: '#ffa500' }
                            ]}
                            title={t('errorTrends')}
                            description={t('errorTrendsDesc')}
                        />
                        <TopListCard
                            title={t('topErrorSources')}
                            data={(statistics?.errors?.topErrorSources || []).map((source: any) => ({
                                name: source.source,
                                value: source.error_count,
                                subtitle: `${source.errors} ${t('errorsLabel')}, ${source.warnings} ${t('warningsLabel')}`
                            }))}
                            valueLabel={t('errorsLabel')}
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
