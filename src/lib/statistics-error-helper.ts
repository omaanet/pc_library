/**
 * Statistics Error Helper
 * Utility for collecting and handling errors from statistics API calls
 */

export interface StatisticsError {
    endpoint: string;
    error: string;
    timestamp: Date;
    status?: number;
}

export interface StatisticsFetchResult<T> {
    data?: T;
    error?: StatisticsError;
    success: boolean;
}

export interface StatisticsResults {
    downloads?: any;
    readingSessions?: any;
    popularBooks?: any;
    userActivity?: any;
    errors?: any;
    failedEndpoints: StatisticsError[];
}

/**
 * Fetches statistics data with error collection
 * Uses Promise.allSettled to allow partial success
 */
export async function fetchStatisticsWithErrors(
    timeRange: string,
    topListSize: string,
    onToast?: (message: string, type: 'error' | 'success') => void
): Promise<StatisticsResults> {
    const limit = topListSize === 'all' ? 999999 : parseInt(topListSize);
    const endpoints = [
        { name: 'downloads', url: `/api/statistics/downloads?days=${timeRange}&limit=${limit}` },
        { name: 'readingSessions', url: `/api/statistics/reading-sessions?days=${timeRange}&limit=${limit}` },
        { name: 'popularBooks', url: `/api/statistics/popular-books?days=${timeRange}&limit=${limit}` },
        { name: 'userActivity', url: `/api/statistics/user-activity?days=${timeRange}&limit=${limit}` },
        { name: 'errors', url: `/api/statistics/errors?days=${timeRange}&limit=${limit}` }
    ];

    const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
            const response = await fetch(endpoint.url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            return { name: endpoint.name, data: await response.json() };
        })
    );

    const statisticsResults: StatisticsResults = {
        failedEndpoints: []
    };

    results.forEach((result, index) => {
        const endpoint = endpoints[index];
        
        if (result.status === 'fulfilled') {
            // Map the data to the appropriate property
            (statisticsResults as any)[result.value.name] = result.value.data;
        } else {
            // Collect the error
            const error: StatisticsError = {
                endpoint: endpoint.name,
                error: result.reason.message || 'Unknown error',
                timestamp: new Date(),
                status: result.reason.status || 500
            };
            
            statisticsResults.failedEndpoints.push(error);
            
            // Show toast notification if callback provided
            if (onToast) {
                onToast(
                    `Failed to load ${endpoint.name}: ${error.error}`,
                    'error'
                );
            }
        }
    });

    return statisticsResults;
}

/**
 * Retry a failed endpoint
 */
export async function retryEndpoint(
    endpointName: string,
    timeRange: string,
    topListSize: string
): Promise<StatisticsFetchResult<any>> {
    const limit = topListSize === 'all' ? 999999 : parseInt(topListSize);
    const endpointMap: Record<string, string> = {
        downloads: `/api/statistics/downloads?days=${timeRange}&limit=${limit}`,
        readingSessions: `/api/statistics/reading-sessions?days=${timeRange}&limit=${limit}`,
        popularBooks: `/api/statistics/popular-books?days=${timeRange}&limit=${limit}`,
        userActivity: `/api/statistics/user-activity?days=${timeRange}&limit=${limit}`,
        errors: `/api/statistics/errors?days=${timeRange}&limit=${limit}`
    };

    const url = endpointMap[endpointName];
    if (!url) {
        return {
            success: false,
            error: {
                endpoint: endpointName,
                error: 'Unknown endpoint',
                timestamp: new Date()
            }
        };
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error) {
        return {
            success: false,
            error: {
                endpoint: endpointName,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            }
        };
    }
}
