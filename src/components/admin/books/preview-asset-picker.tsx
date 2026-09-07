'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PreviewAssetPickerProps {
    files: string[];
    value?: string | null;
    onSelect: (file: string) => void;
    imageUrl: (file: string) => string;
    label: string;
    placeholder?: string;
    emptyMessage: string;
    disabled?: boolean;
}

export function PreviewAssetPicker({
    files, value, onSelect, imageUrl, label,
    placeholder = 'Seleziona un file', emptyMessage, disabled,
}: PreviewAssetPickerProps) {
    const [open, setOpen] = useState(false);

    function select(file: string) {
        onSelect(file);
        setOpen(false);
    }

    return <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button type="button" variant="outline" disabled={disabled}
                aria-label={label} aria-expanded={open && !disabled}
                className="min-w-0 w-full justify-between gap-3 font-normal">
                <span className="truncate">{value || placeholder}</span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} collisionPadding={16}
            aria-label={label}
            className="w-[min(30rem,calc(100vw-2rem))] p-0">
            <ScrollArea className="h-72">
                <div className="p-2">
                    {value && <Button type="button" variant="ghost" className="mb-1 w-full justify-start font-normal" onClick={() => select('')}>Deseleziona il file</Button>}
                    {files.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p> : files.map(file => (
                        <button key={file} type="button" aria-pressed={file === value}
                            className={cn('flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', file === value && 'bg-accent')}
                            onClick={() => select(file)}>
                            {/* Same thumbnail-and-filename layout as the main cover picker. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl(file)} alt="" loading="lazy" className="h-14 w-10 shrink-0 rounded border bg-muted object-contain" />
                            <span className="min-w-0 flex-1 break-all">{file}</span>
                            <Check aria-hidden="true" className={cn('h-4 w-4 shrink-0', file === value ? 'opacity-100' : 'opacity-0')} />
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </PopoverContent>
    </Popover>;
}
