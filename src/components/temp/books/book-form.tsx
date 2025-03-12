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

// Form validation schema
const bookFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    coverImage: z.string().default(IMAGE_CONFIG.placeholder.token),
    publishingDate: z.date({
        required_error: 'Publishing date is required',
    }),
    summary: z.string().min(1, 'Summary is required'),
    hasAudio: z.boolean().default(false),
    audioLength: z.number().min(1).optional(),
    extract: z.string().optional(),
    rating: z.number().min(1).max(5).nullable().optional(),
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
        publishingDate: book?.publishingDate ? new Date(book.publishingDate) : new Date(),
        summary: book?.summary || '',
        hasAudio: book?.hasAudio || false,
        audioLength: book?.audioLength,
        extract: book?.extract || '',
        rating: book?.rating,
    };

    const form = useForm<BookFormValues>({
        resolver: zodResolver(bookFormSchema),
        defaultValues,
    });

    // Watch hasAudio to show/hide audioLength field
    const hasAudio = form.watch('hasAudio');
    React.useEffect(() => {
        setShowAudioLength(hasAudio);
    }, [hasAudio]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            <FormLabel>Summary</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Book summary"
                                    className="min-h-[120px]"
                                    {...field}
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
                            <FormLabel>Extract (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Book extract"
                                    className="min-h-[120px]"
                                    {...field}
                                    value={field.value || ''}
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
                            <FormLabel>Cover Image</FormLabel>
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
                    name="hasAudio"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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
                        </FormItem>
                    )}
                />

                {showAudioLength && (
                    <FormField
                        control={form.control}
                        name="audioLength"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Audio Length (minutes)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Audio length in minutes"
                                        {...field}
                                        value={field.value || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            field.onChange(value ? parseInt(value, 10) : undefined);
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    The length of the audio version in minutes
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rating (Optional)</FormLabel>
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
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
