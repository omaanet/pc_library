import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
