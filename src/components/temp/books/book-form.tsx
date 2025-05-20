'use client';

import * as React from 'react';
import { useState } from 'react';
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
    publishingDate: z.date({
        required_error: 'Publishing date is required',
    }),
    // summary: z.string().min(1, 'Summary is required'),
    summary: z.string().optional(),
    hasAudio: z.boolean().default(false),
    audioLength: z.number().min(1).optional(),
    extract: z.string().optional(),
    rating: z.number().min(1).max(5).nullable().optional(),
    isPreview: z.boolean().default(false),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

interface BookFormProps {
    book?: Book;
    onSubmit: (values: BookFormValues) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function BookForm({ book, onSubmit, onCancel, isSubmitting }: BookFormProps) {
    const [showAudioLength, setShowAudioLength] = useState(book?.hasAudio || false);

    // Default values for the form
    const defaultValues: Partial<BookFormValues> = {
        title: book?.title || '',
        coverImage: book?.coverImage || IMAGE_CONFIG.placeholder.token,
        pagesCount: book?.pagesCount,
        publishingDate: book?.publishingDate ? new Date(book.publishingDate) : new Date(),
        summary: book?.summary || '',
        hasAudio: book?.hasAudio || false,
        audioLength: book?.audioLength,
        extract: book?.extract || '',
        rating: book?.rating,
        isPreview: book?.isPreview || false,
    };

    const form = useForm<BookFormValues>({
        resolver: zodResolver(bookFormSchema),
        defaultValues,
        mode: "onBlur",
    });

    // Watch hasAudio to show/hide audioLength field
    const hasAudio = form.watch('hasAudio');
    React.useEffect(() => {
        setShowAudioLength(hasAudio);
    }, [hasAudio]);

    // Submit handler that properly logs and calls the parent's onSubmit function
    const handleSubmit = async (data: BookFormValues) => {
        console.log("Form submitted with values:", data);
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
                    console.log("Form submitted manually with values:", formData);
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
                                    />
                                </FormControl>
                            </div>

                            {field.value && (
                                <div className="ms-10">
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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
                            console.log("Button clicked, submitting with values:", formData);
                            if (Object.keys(form.formState.errors).length > 0) {
                                console.log("Form validation errors:", form.formState.errors);
                            }
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