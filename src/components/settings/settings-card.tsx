'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
}

export function SettingsCard({
    title,
    description,
    children,
    className,
    ...props
}: SettingsCardProps) {
    return (
        <Card className={cn('w-full', className)} {...props}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
