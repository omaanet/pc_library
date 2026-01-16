'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { Calendar, Download, BookOpen, Users, AlertTriangle, TrendingUp, Activity, RefreshCw, Loader2 } from 'lucide-react';
import { fetchStatisticsWithErrors, retryEndpoint, type StatisticsResults, type StatisticsError } from '@/lib/statistics-error-helper';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UserStatisticsPage() {
    const router = useRouter();
    const { state } = useAuth();
    const [timeRange, setTimeRange] = useState('all');
    const [topListSize, setTopListSize] = useState('5');
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
    const fetchStatistics = async () => {
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
            setError('Failed to load statistics');
            console.error('Error fetching statistics:', err);
        } finally {
            setLoading(false);
        }
    };

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
                description: `Successfully loaded ${endpointName}`,
            });
        } else {
            toast({
                title: 'Error',
                description: `Failed to retry ${endpointName}: ${result.error?.error}`,
                variant: 'destructive'
            });
        }
    };

    useEffect(() => {
        if (state.isAuthenticated && state.user?.isAdmin) {
            fetchStatistics();
        }
    }, [timeRange, topListSize, state.isAuthenticated, state.user?.isAdmin]);

    // Show loading state while checking authentication
    if (state.isLoading) {
        return (
            <div className="container mx-auto p-10 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Verifica autorizzazione...</p>
                </div>
            </div>
        );
    }

    // Don't render content if not authorized (will redirect)
    if (!state.isAuthenticated || !state.user?.isAdmin) {
        return null;
    }

    // Show initial loading screen only when there's no data yet
    if (loading && !statistics) {
        return (
            <div className="container mx-auto p-10 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Loading statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-10">
                <div className="text-center">
                    <p className="text-lg text-red-600">{error}</p>
                    <Button onClick={fetchStatistics} className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="container mx-auto p-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">User Statistics</h1>
                <div className="flex items-center space-x-4">
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last 365 days</SelectItem>
                            <SelectItem value="all">All data</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={topListSize} onValueChange={setTopListSize}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Top" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">Top 5</SelectItem>
                            <SelectItem value="10">Top 10</SelectItem>
                            <SelectItem value="50">Top 50</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button asChild variant="outline">
                        <Link href="/" className="select-none">
                            Go Back to Home
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Error Summary */}
            {failedEndpoints.length > 0 && (
                <Alert className="mb-6 border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="space-y-2">
                        <div className="font-medium text-orange-800">
                            Some endpoints failed to load ({failedEndpoints.length} errors)
                        </div>
                        <div className="space-y-1">
                            {failedEndpoints.map((error, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <span className="text-orange-700">
                                        <strong>{error.endpoint}</strong>: {error.error}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRetryEndpoint(error.endpoint)}
                                        className="ml-2 h-6 px-2 text-xs"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Retry
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatsCard
                    title="Total Downloads"
                    value={statistics?.downloads?.totalStats?.total_downloads?.toLocaleString('it-IT') || '0'}
                    description={`${statistics?.downloads?.totalStats?.unique_users || 0} unique users`}
                    icon={<Download className="h-4 w-4 text-blue-500" />}
                />
                <StatsCard
                    title="Reading Sessions"
                    value={statistics?.readingSessions?.totalStats?.total_sessions?.toLocaleString('it-IT') || '0'}
                    description={`${statistics?.readingSessions?.totalStats?.unique_readers || 0} unique readers`}
                    icon={<BookOpen className="h-4 w-4 text-amber-500" />}
                />
                <StatsCard
                    title="Active Users"
                    value={statistics?.userActivity?.overallStats?.unique_active_users?.toLocaleString('it-IT') || '0'}
                    description={`${statistics?.userActivity?.overallStats?.total_actions?.toLocaleString('it-IT') || 0} total actions`}
                    icon={<Users className="h-4 w-4 text-purple-500" />}
                />
                <StatsCard
                    title="System Errors"
                    value={statistics?.errors?.overallStats?.total_errors?.toLocaleString('it-IT') || '0'}
                    description={`${statistics?.errors?.overallStats?.errors || 0} errors, ${statistics?.errors?.overallStats?.warnings || 0} warnings`}
                    icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="downloads">Downloads</TabsTrigger>
                    <TabsTrigger value="reading">Reading</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="errors">Errors</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <ActivityChart
                            data={statistics?.downloads?.downloadsOverTime || []}
                            lines={[
                                { dataKey: 'downloads_count', name: 'Downloads', color: '#8884d8' },
                                { dataKey: 'unique_users', name: 'Unique Users', color: '#82ca9d' }
                            ]}
                            title="Download Trends"
                            description="Daily downloads and unique users"
                        />
                        <ActivityChart
                            data={statistics?.readingSessions?.sessionsOverTime || []}
                            lines={[
                                { dataKey: 'sessions_count', name: 'Sessions', color: '#ffc658' },
                                { dataKey: 'unique_readers', name: 'Readers', color: '#ff7c7c' }
                            ]}
                            title="Reading Activity"
                            description="Daily reading sessions and unique readers"
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <TopListCard
                            title="Most Downloaded Books"
                            data={(statistics?.downloads?.mostDownloadedBooks || []).map((book: any) => ({
                                name: book.book_title,
                                value: book.download_count,
                                subtitle: `${book.unique_downloaders} unique users`
                            }))}
                            valueLabel="downloads"
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                        <TopListCard
                            title="Most Read Books"
                            data={(statistics?.readingSessions?.mostReadBooks || []).map((book: any) => ({
                                name: book.book_title,
                                value: book.read_sessions,
                                subtitle: `${book.unique_readers} readers`
                            }))}
                            valueLabel="sessions"
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="downloads" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Download Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Total Downloads:</span>
                                    <span className="font-semibold">{statistics?.downloads?.totalStats?.total_downloads?.toLocaleString('it-IT') || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Unique Users:</span>
                                    <span className="font-semibold">{statistics?.downloads?.totalStats?.unique_users?.toLocaleString('it-IT') || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Unique Books:</span>
                                    <span className="font-semibold">{statistics?.downloads?.totalStats?.unique_books?.toLocaleString('it-IT') || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Size:</span>
                                    <span className="font-semibold">{formatBytes(statistics?.downloads?.totalStats?.total_bytes_downloaded || 0)}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <TopListCard
                            title="Top Downloaders"
                            data={(statistics?.downloads?.topDownloaders || []).map((user: any) => ({
                                name: user.full_name,
                                value: user.download_count,
                                subtitle: user.email
                            }))}
                            valueLabel="downloads"
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="reading" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <BarChartComponent
                            data={(statistics?.readingSessions?.sessionsByHour || []).map((hour: any) => ({
                                name: `${hour.hour_of_day}:00`,
                                value: hour.sessions_count
                            }))}
                            title="Reading Activity by Hour"
                            description="Number of reading sessions per hour of day"
                            color="#ffc658"
                        />
                        <TopListCard
                            title="Top Readers"
                            data={(statistics?.readingSessions?.topReaders || []).map((user: any) => ({
                                name: user.full_name,
                                value: user.reading_sessions,
                                subtitle: `${user.unique_books_read} books`
                            }))}
                            valueLabel="sessions"
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <ActivityChart
                            data={statistics?.userActivity?.dailyActiveUsers || []}
                            lines={[
                                { dataKey: 'daily_active_users', name: 'Active Users', color: '#8884d8' }
                            ]}
                            title="Daily Active Users"
                            description="Number of unique users per day"
                        />
                        <Card>
                            <CardHeader>
                                <CardTitle>User Engagement Distribution</CardTitle>
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
                        title="Most Active Users"
                        data={(statistics?.userActivity?.mostActiveUsers || []).map((user: any) => ({
                            name: user.full_name,
                            value: user.total_actions,
                            subtitle: `${user.books_downloaded} downloads, ${user.books_read} books read`
                        }))}
                        valueLabel="actions"
                        maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                    />
                </TabsContent>

                <TabsContent value="errors" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <ActivityChart
                            data={statistics?.errors?.errorsOverTime || []}
                            lines={[
                                { dataKey: 'errors', name: 'Errors', color: '#ff7c7c' },
                                { dataKey: 'warnings', name: 'Warnings', color: '#ffa500' }
                            ]}
                            title="Error Trends"
                            description="Daily errors and warnings"
                        />
                        <TopListCard
                            title="Top Error Sources"
                            data={(statistics?.errors?.topErrorSources || []).map((source: any) => ({
                                name: source.source,
                                value: source.error_count,
                                subtitle: `${source.errors} errors, ${source.warnings} warnings`
                            }))}
                            valueLabel="errors"
                            maxItems={topListSize === 'all' ? 999999 : parseInt(topListSize)}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
