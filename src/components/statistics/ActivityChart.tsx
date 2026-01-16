'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityChartProps {
    data: Array<{
        date: string;
        [key: string]: any;
    }>;
    lines: Array<{
        dataKey: string;
        name: string;
        color: string;
    }>;
    title: string;
    description?: string;
    className?: string;
}

export function ActivityChart({ 
    data, 
    lines, 
    title, 
    description, 
    className 
}: ActivityChartProps) {
    const formatXAxis = (tickItem: string) => {
        const date = new Date(tickItem);
        return date.toLocaleDateString('it-IT', { 
            day: 'numeric', 
            month: 'short' 
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={formatXAxis}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                            labelFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('it-IT', { 
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });
                            }}
                            formatter={(value: any, name?: string) => [
                                value,
                                lines.find(l => l.dataKey === name)?.name || name || ''
                            ]}
                        />
                        {lines.map((line) => (
                            <Line
                                key={line.dataKey}
                                type="monotone"
                                dataKey={line.dataKey}
                                stroke={line.color}
                                strokeWidth={2}
                                dot={false}
                                name={line.name}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}