'use client';

import * as React from 'react';
import {
    Check,
    ChevronsUpDown,
    ImageIcon,
    Loader2,
    Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getCoverImageUrl, IMAGE_CONFIG } from '@/lib/image-utils';

interface CoversResponse {
    covers: string[];
}

interface CoverImagePickerProps
    extends Omit<React.ComponentPropsWithoutRef<'input'>, 'onChange' | 'value'> {
    value: string;
    onValueChange: (value: string) => void;
    bookId?: string;
}

function isCoversResponse(value: unknown): value is CoversResponse {
    if (!value || typeof value !== 'object' || !('covers' in value)) {
        return false;
    }

    return Array.isArray(value.covers)
        && value.covers.every((cover) => typeof cover === 'string');
}

export const CoverImagePicker = React.forwardRef<
    HTMLInputElement,
    CoverImagePickerProps
>(function CoverImagePicker(
    {
        value,
        onValueChange,
        bookId,
        disabled,
        className,
        ...inputProps
    },
    ref
) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [covers, setCovers] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const controller = new AbortController();

        async function loadCovers() {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch('/api/covers', {
                    cache: 'no-store',
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const data: unknown = await response.json();
                if (!isCoversResponse(data)) {
                    throw new Error('Invalid cover list response');
                }

                setCovers(data.covers);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }

                console.error('[CoverImagePicker] Failed to load covers:', error);
                setLoadError('Impossibile caricare le copertine dal server.');
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        void loadCovers();

        return () => controller.abort();
    }, []);

    const options = React.useMemo(
        () => [
            IMAGE_CONFIG.placeholder.token,
            ...covers.filter((cover) => cover !== IMAGE_CONFIG.placeholder.token),
        ],
        [covers]
    );
    const filteredOptions = React.useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase('it');
        if (!normalizedSearch) {
            return options;
        }

        return options.filter((cover) =>
            cover.toLocaleLowerCase('it').includes(normalizedSearch)
        );
    }, [options, search]);

    const previewPath = value.trim() || IMAGE_CONFIG.placeholder.token;
    const previewUrl = getCoverImageUrl(previewPath, 'detail', {
        bookId: previewPath === IMAGE_CONFIG.placeholder.token ? bookId : undefined,
    });

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            setSearch('');
        }
    };

    const selectCover = (cover: string) => {
        onValueChange(cover);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-start">
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <div className="flex min-w-0">
                    <Input
                        {...inputProps}
                        ref={ref}
                        value={value}
                        disabled={disabled}
                        className={cn('rounded-r-none', className)}
                        onChange={(event) => onValueChange(event.target.value)}
                    />
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={disabled}
                            className="shrink-0 rounded-l-none border-l-0"
                            aria-label="Scegli una copertina dal server"
                            aria-expanded={isOpen}
                        >
                            <ChevronsUpDown className="h-4 w-4 opacity-60" />
                        </Button>
                    </PopoverTrigger>
                </div>

                <PopoverContent
                    className="w-[min(30rem,calc(100vw-2rem))] p-0"
                    align="start"
                    sideOffset={6}
                    collisionPadding={16}
                >
                    <div className="border-b p-3">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cerca una copertina..."
                                className="pl-8"
                                aria-label="Cerca copertine"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Caricamento copertine...
                        </div>
                    ) : loadError ? (
                        <div className="p-4 text-sm text-destructive">
                            {loadError}
                            <p className="mt-1 text-muted-foreground">
                                Il percorso può comunque essere inserito manualmente.
                            </p>
                        </div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            Nessuna copertina trovata.
                        </div>
                    ) : (
                        <ScrollArea className="h-72">
                            <div className="p-2">
                                {filteredOptions.map((cover) => {
                                    const thumbnailUrl = getCoverImageUrl(cover, 'list', {
                                        bookId: cover === IMAGE_CONFIG.placeholder.token
                                            ? bookId
                                            : undefined,
                                    });
                                    const isSelected = cover === value;

                                    return (
                                        <button
                                            key={cover}
                                            type="button"
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                                                isSelected && 'bg-accent'
                                            )}
                                            onClick={() => selectCover(cover)}
                                        >
                                            <img
                                                src={thumbnailUrl}
                                                alt=""
                                                loading="lazy"
                                                className="h-14 w-10 shrink-0 rounded border bg-muted object-contain"
                                            />
                                            <span className="min-w-0 flex-1 break-words">
                                                {cover}
                                            </span>
                                            <Check
                                                className={cn(
                                                    'h-4 w-4 shrink-0',
                                                    isSelected ? 'opacity-100' : 'opacity-0'
                                                )}
                                                aria-hidden="true"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </PopoverContent>
            </Popover>

            <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-md border bg-muted/30 p-1">
                {previewPath ? (
                    <img
                        key={previewUrl}
                        src={previewUrl}
                        alt="Anteprima copertina"
                        className="h-36 w-full object-contain"
                    />
                ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
            </div>
        </div>
    );
});

CoverImagePicker.displayName = 'CoverImagePicker';
