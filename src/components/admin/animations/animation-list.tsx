/**
 * AnimationList — Left rail of /animations-manager.
 *
 * Groups the registry by `group` (Poses / Actions / Choreographies) and
 * lets the admin pick a single entry to inspect.
 */
'use client';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ANIMATION_GROUPS,
    type AnimationEntry,
    type AnimationGroup,
} from './animation-registry';

interface AnimationListProps {
    entries: AnimationEntry[];
    selectedId: string;
    onSelect: (id: string) => void;
}

const GROUP_LABELS: Record<AnimationGroup, string> = {
    Poses: 'Pose',
    Actions: 'Azioni',
    Choreographies: 'Coreografie',
};

export function AnimationList({ entries, selectedId, onSelect }: AnimationListProps) {
    return (
        <ScrollArea className="h-[calc(100vh-12rem)] rounded-md border bg-card">
            <div className="p-2 space-y-4">
                {ANIMATION_GROUPS.map((group) => {
                    const groupEntries = entries.filter((e) => e.group === group);
                    if (groupEntries.length === 0) return null;
                    return (
                        <div key={group}>
                            <div className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {GROUP_LABELS[group]}
                                <span className="ml-2 text-[10px] font-normal text-muted-foreground/70">
                                    ({groupEntries.length})
                                </span>
                            </div>
                            <ul className="space-y-0.5">
                                {groupEntries.map((entry) => {
                                    const isActive = entry.id === selectedId;
                                    return (
                                        <li key={entry.id}>
                                            <button
                                                type="button"
                                                onClick={() => onSelect(entry.id)}
                                                className={cn(
                                                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground font-medium'
                                                        : 'hover:bg-accent hover:text-accent-foreground',
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate">{entry.name}</span>
                                                    <span
                                                        className={cn(
                                                            'text-[10px] uppercase tracking-wider shrink-0 rounded px-1.5 py-0.5',
                                                            isActive
                                                                ? 'bg-primary-foreground/20'
                                                                : 'bg-muted text-muted-foreground',
                                                        )}
                                                    >
                                                        {entry.kind}
                                                    </span>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
