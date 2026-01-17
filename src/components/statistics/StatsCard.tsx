'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon?: React.ReactNode;
    className?: string;
}

export function StatsCard({ 
    title, 
    value, 
    description, 
    trend, 
    icon, 
    className 
}: StatsCardProps) {
    return (
        <Card className={cn('relative overflow-hidden transition-all duration-200 hover:shadow-md', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
                <div className="p-1 sm:p-1.5 rounded-md bg-muted/50">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 pt-0">
                <div className="text-xl sm:text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
                {trend && (
                    <div className="flex items-center mt-2">
                        <span
                            className={cn(
                                'text-xs font-medium',
                                trend.isPositive ? 'text-green-600' : 'text-red-600'
                            )}
                        >
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                            from last period
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
