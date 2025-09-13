'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Book } from '@/types';
import { IMAGE_CONFIG } from '@/lib/image-utils';
import ThemedButton from '@/components/ThemedButton';

// Form validation schema
const bookFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    coverImage: z.string().default(IMAGE_CONFIG.placeholder.token),
    pagesCount: z.number().int().min(1, 'Page count must be at least 1').optional(),
    displayOrder: z.number().int().nullable().optional(),
    publishingDate: z.date({
        required_error: 'Publishing date is required',
    }),
    summary: z.string().nullable().optional(),
    hasAudio: z.boolean().default(false),
    audioLength: z.number().min(1).nullable().optional(),
    extract: z.string().nullable().optional(),
    rating: z.number().min(1).max(5).nullable().optional(),
    isPreview: z.boolean().default(false),
    isVisible: z.boolean().default(true),
    // Audiobook specific fields
    audiobook: z.object({
        mediaId: z.string().nullable().optional()
    }).optional(),
    // Preview media fields (optional)
    mediaId: z.string().nullable().optional(),
    mediaTitle: z.string().nullable().optional(),
    mediaUid: z.string().nullable().optional(),
    previewPlacement: z.string().nullable().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

interface BookFormProps {
    book?: Book;
    onSubmit: (values: BookFormValues) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function BookForm({ book, onSubmit, onCancel, isSubmitting }: BookFormProps) {
    // Debug log to see what data is being received
    console.log('[BookForm] Received book data:', JSON.stringify(book, null, 2));
    console.log('[BookForm] hasAudio:', book?.hasAudio);
    console.log('[BookForm] audiobook:', book?.audiobook);
    console.log('[BookForm] audiobook.mediaId:', book?.audiobook?.mediaId);

    const [showAudioLength, setShowAudioLength] = useState(book?.hasAudio || false);

    // Ensure book.audiobook is defined if hasAudio is true
    if (book?.hasAudio && !book.audiobook) {
        console.log('[BookForm] Creating missing audiobook object');
        book = {
            ...book,
            audiobook: { mediaId: null }
        };
    }

    // Default values for the form
    const defaultValues: Partial<BookFormValues> = {
        title: book?.title || '',
        coverImage: book?.coverImage || IMAGE_CONFIG.placeholder.token,
        pagesCount: book?.pagesCount,
        displayOrder: book?.displayOrder ?? null,
        publishingDate: book?.publishingDate ? new Date(book.publishingDate) : new Date(),
        summary: book?.summary || '',
        hasAudio: book?.hasAudio || false,
        audioLength: book?.audioLength,
        extract: book?.extract || '',
        rating: book?.rating,
        isPreview: book?.isPreview || false,
        isVisible: book?.isVisible !== undefined ? Boolean(book.isVisible) : true,
        audiobook: {
            mediaId: book?.audiobook?.mediaId || null
        },
        mediaId: book?.mediaId ?? null,
        mediaTitle: book?.mediaTitle ?? null,
        mediaUid: book?.mediaUid ?? '1',
        previewPlacement: book?.previewPlacement ?? null,
    };

    const form = useForm<BookFormValues>({
        resolver: zodResolver(bookFormSchema),
        defaultValues,
        mode: "onBlur",
    });

    // Reset form when book prop changes
    useEffect(() => {
        console.log('[BookForm] Book changed, resetting form with:', book);
        if (book) {
            form.reset({
                title: book.title || '',
                coverImage: book.coverImage || IMAGE_CONFIG.placeholder.token,
                pagesCount: book.pagesCount,
                displayOrder: book.displayOrder ?? null,
                publishingDate: book.publishingDate ? new Date(book.publishingDate) : new Date(),
                summary: book.summary || '',
                hasAudio: book.hasAudio || false,
                audioLength: book.audioLength,
                extract: book.extract || '',
                rating: book.rating,
                isPreview: book.isPreview || false,
                isVisible: book.isVisible !== undefined ? Boolean(book.isVisible) : true,
                audiobook: {
                    mediaId: book.audiobook?.mediaId || null
                },
                mediaId: book.mediaId ?? null,
                mediaTitle: book.mediaTitle ?? null,
                mediaUid: book.mediaUid ?? '1',
                previewPlacement: book.previewPlacement ?? null,
            });
        }
    }, [book, form]);

    // Watch hasAudio to show/hide audioLength field
    const hasAudio = form.watch('hasAudio');
    useEffect(() => {
        setShowAudioLength(hasAudio);
    }, [hasAudio]);

    // Submit handler that properly logs and calls the parent's onSubmit function
    const handleSubmit = async (data: BookFormValues) => {
        // console.log("Form submitted with values:", data);
        try {
            await onSubmit(data);
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    const formData = form.getValues();
                    // console.log("Form submitted manually with values:", formData);
                    handleSubmit(formData);
                }}
                noValidate
                lang="it"
            >
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Book title" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="publishingDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Publishing Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Summary <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Book summary"
                                    className="min-h-0 focus:min-h-[120px]"
                                    {...field}
                                    value={field.value || ''}
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="extract"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Extract <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Book extract"
                                    className="focus:min-h-[120px]"
                                    {...field}
                                    value={field.value || ''}
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                            </FormControl>
                            <FormDescription>
                                A sample extract from the book
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cover Image <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Cover image path"
                                    {...field}
                                    value={field.value || IMAGE_CONFIG.placeholder.token}
                                />
                            </FormControl>
                            <FormDescription>
                                Use {IMAGE_CONFIG.placeholder.token} for a placeholder image
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="pagesCount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Page Count <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Number of pages"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value ? parseInt(value, 10) : undefined);
                                    }}
                                    className="w-auto"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Order <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="Display order (lower numbers first)"
                                    value={field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === '' ? null : parseInt(value, 10));
                                    }}
                                    className="w-auto"
                                />
                            </FormControl>
                            <FormDescription>
                                Lower numbers appear first in listings
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="hasAudio"
                    render={({ field }) => (
                        <FormItem className={`space-y-4 rounded-lg border-2 p-4 transition-colors ${field.value ? 'border-primary/50' : 'border-border'}`}>
                            <div className="flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Audio Version</FormLabel>
                                    <FormDescription>
                                        Does this book have an audio version?
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </FormControl>
                            </div>

                            {field.value && (
                                <div className="ms-10 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="audiobook.mediaId"
                                        render={({ field: mediaField }) => (
                                            <FormItem>
                                                <FormLabel>Media ID <span className="text-muted-foreground">(optional)</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Audiobook media ID"
                                                        value={mediaField.value || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            mediaField.onChange(value || null);
                                                        }}
                                                        className="w-auto"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    The media ID from the audiobooks table
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="audioLength"
                                        render={({ field: audioField }) => (
                                            <FormItem>
                                                <FormLabel>Audio Length <span className="text-muted-foreground">(seconds)</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Audio length in seconds"
                                                        value={audioField.value || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            audioField.onChange(value ? parseInt(value, 10) : undefined);
                                                        }}
                                                        className="w-auto"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    The length of the audio version in seconds
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isPreview"
                    render={({ field }) => (
                        <FormItem className={`space-y-4 rounded-lg border-2 p-4 transition-colors ${field.value ? 'border-primary/50' : 'border-border'}`}>
                            <div className="flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Preview Book</FormLabel>
                                    <FormDescription>
                                        Is this book a preview version?
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </FormControl>
                            </div>

                            {field.value && (
                                <div className="ms-10 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="mediaId"
                                        render={({ field: mediaIdField }) => (
                                            <FormItem>
                                                <FormLabel>Media ID <span className="text-muted-foreground">(optional)</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Mux playback ID"
                                                        value={mediaIdField.value || ''}
                                                        onChange={(e) => mediaIdField.onChange(e.target.value || null)}
                                                        className="w-auto"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Optional Mux playback ID used for the preview video
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="mediaTitle"
                                        render={({ field: mediaTitleField }) => (
                                            <FormItem>
                                                <FormLabel>Media Title <span className="text-muted-foreground">(optional)</span></FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Mux media title"
                                                            value={mediaTitleField.value || ''}
                                                            onChange={(e) => mediaTitleField.onChange(e.target.value || null)}
                                                            className="flex-1"
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentTitle = (form.getValues().title || '').trim();
                                                            mediaTitleField.onChange(currentTitle.length ? currentTitle : null);
                                                        }}
                                                    >
                                                        Use Book Title
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="mediaUid"
                                        render={({ field: mediaUidField }) => (
                                            <FormItem>
                                                <FormLabel>Media UserID <span className="text-muted-foreground">(optional)</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Viewer user id"
                                                        value={mediaUidField.value || ''}
                                                        onChange={(e) => mediaUidField.onChange(e.target.value || null)}
                                                        className="w-auto"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="previewPlacement"
                                        render={({ field: placementField }) => (
                                            <FormItem>
                                                <FormLabel>Preview placement (left/right) <span className="text-muted-foreground">(optional)</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="left or right"
                                                        value={placementField.value || ''}
                                                        onChange={(e) => placementField.onChange(e.target.value || null)}
                                                        className="w-auto"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Determines whether the preview video appears before (left) or after (right) the cover
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isVisible"
                    render={({ field }) => (
                        <FormItem className={`flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-colors ${field.value ? 'border-primary/50' : 'border-border'}`}>
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Visible to Users</FormLabel>
                                <FormDescription>
                                    Should this book be visible to regular users?
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-green-500"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rating <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Rating (1-5)"
                                    min={1}
                                    max={5}
                                    {...field}
                                    value={field.value === undefined || field.value === null ? '' : field.value}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === '' ? null : parseInt(value, 10));
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                Rating from 1 to 5 stars
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="select-none"
                    >
                        Cancel
                    </Button>
                    {/* <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                            const formData = form.getValues();
                            console.log("Button clicked, submitting with values:", formData);
                            if (Object.keys(form.formState.errors).length > 0) {
                                console.log("Form validation errors:", form.formState.errors);
                            }
                            handleSubmit(formData);
                        }}
                        className="select-none"
                    >
                        {isSubmitting ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
                    </Button> */}
                    <ThemedButton
                        type="button"
                        disabled={isSubmitting}
                        color="green"
                        onClick={() => {
                            const formData = form.getValues();
                            /*console.log("Button clicked, submitting with values:", formData);
                            if (Object.keys(form.formState.errors).length > 0) {
                                console.log("Form validation errors:", form.formState.errors);
                            }*/
                            handleSubmit(formData);
                        }}
                        className="select-none"
                    >
                        {isSubmitting ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
                    </ThemedButton>
                </div>
            </form>

            {/* <div className="p-6 space-y-6">
                <h2 className="text-lg font-bold">Theme Colors</h2>
                <div className="flex flex-wrap gap-3">
                    <ThemedButton color="#ef4444">Red</ThemedButton>
                    <ThemedButton color="#3b82f6">Blue</ThemedButton>
                    <ThemedButton color="#10b981">Green</ThemedButton>
                    <ThemedButton color="#f59e0b">Orange</ThemedButton>
                    <ThemedButton color="#8b5cf6">Purple</ThemedButton>
                </div>

                <h2 className="text-lg font-bold">Variants</h2>
                <div className="flex flex-wrap gap-3">
                    <ThemedButton color="#ef4444">Solid</ThemedButton>
                    <ThemedButton color="#ef4444" variant="outline">Outline</ThemedButton>
                    <ThemedButton color="#ef4444" variant="ghost">Ghost</ThemedButton>
                </div>

                <h2 className="text-lg font-bold">Sizes</h2>
                <div className="flex flex-wrap gap-3 items-center">
                    <ThemedButton color="#3b82f6" size="sm">Small</ThemedButton>
                    <ThemedButton color="#3b82f6" size="md">Medium</ThemedButton>
                    <ThemedButton color="#3b82f6" size="lg">Large</ThemedButton>
                </div>

                <h2 className="text-lg font-bold">Disabled State</h2>
                <div className="flex flex-wrap gap-3">
                    <ThemedButton color="#10b981" disabled>Disabled</ThemedButton>
                    <ThemedButton color="#10b981" variant="outline" disabled>Disabled Outline</ThemedButton>
                    <ThemedButton color="#10b981" variant="ghost" disabled>Disabled Ghost</ThemedButton>
                </div>
            </div> */}

        </Form>
    );
}