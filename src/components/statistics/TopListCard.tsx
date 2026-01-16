'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TopListCardProps {
    title: string;
    description?: string;
    data: Array<{
        name: string;
        value: number;
        subtitle?: string;
    }>;
    valueLabel?: string;
    maxItems?: number;
    className?: string;
}

export function TopListCard({ 
    title, 
    description, 
    data, 
    valueLabel = 'Count',
    maxItems = 5,
    className 
}: TopListCardProps) {
    const displayData = data.slice(0, maxItems);
    const maxValue = Math.max(...displayData.map(d => d.value));

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                </Badge>
                                <div>
                                    <p className="text-sm font-medium leading-none">
                                        {item.name}
                                    </p>
                                    {item.subtitle && (
                                        <p className="text-xs text-muted-foreground">
                                            {item.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-20 bg-muted rounded-full h-2">
                                    <div 
                                        className="bg-primary h-2 rounded-full" 
                                        style={{ 
                                            width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` 
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-medium min-w-[3rem] text-right">
                                    {item.value.toLocaleString('it-IT')} {valueLabel}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
