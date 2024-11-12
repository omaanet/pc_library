// src/components/shared/view-switcher.tsx
'use client';

import * as React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ViewSwitcherProps {
    view: 'grid' | 'list';
    onViewChange: (view: 'grid' | 'list') => void;
    className?: string;
}

export function ViewSwitcher({ view, onViewChange, className }: ViewSwitcherProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Button
                variant={view === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewChange('grid')}
                aria-label="Grid view"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewChange('list')}
                aria-label="List view"
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
    );
}