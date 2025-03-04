import * as React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
