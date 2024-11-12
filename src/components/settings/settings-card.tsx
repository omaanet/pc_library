// src/components/settings/settings-card.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

// src/components/settings/settings-toggle-item.tsx
interface SettingsToggleItemProps {
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function SettingsToggleItem({
    title,
    description,
    checked,
    onCheckedChange,
    disabled = false,
}: SettingsToggleItemProps) {
    return (
        <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
                <label
                    className={cn(
                        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                        disabled && 'cursor-not-allowed opacity-70'
                    )}
                >
                    {title}
                </label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
        </div>
    );
}

// src/components/settings/settings-select-item.tsx
interface SettingsSelectItemProps {
    title: string;
    description?: string;
    value: string;
    onValueChange: (value: string) => void;
    options: { label: string; value: string }[];
    disabled?: boolean;
}

export function SettingsSelectItem({
    title,
    description,
    value,
    onValueChange,
    options,
    disabled = false,
}: SettingsSelectItemProps) {
    return (
        <div className="space-y-2">
            <div className="space-y-0.5">
                <label
                    className={cn(
                        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                        disabled && 'cursor-not-allowed opacity-70'
                    )}
                >
                    {title}
                </label>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <Select
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// src/components/settings/section-header.tsx
interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>
            {action}
        </div>
    );
}