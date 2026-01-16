'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BarChartProps {
    data: Array<{
        name: string;
        value: number;
        [key: string]: any;
    }>;
    title: string;
    description?: string;
    dataKey?: string;
    color?: string;
    className?: string;
}

export function BarChartComponent({ 
    data, 
    title, 
    description, 
    dataKey = 'value',
    color = '#8884d8',
    className 
}: BarChartProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                            formatter={(value: any) => [
                                value.toLocaleString('it-IT'),
                                title
                            ]}
                        />
                        <Bar 
                            dataKey={dataKey} 
                            fill={color}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
