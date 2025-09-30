'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { AudioBook } from '@/types';
import { useAudiobook } from '@/hooks/use-audiobook';

// Form validation schema
const audioTrackFormSchema = z.object({
    audio_filename: z.string().optional(),
    media_id: z.string().nullable().optional(),
    audio_length: z.number().nullable().optional(),
    publishing_date: z.string().nullable().optional(),
});

type AudioTrackFormValues = z.infer<typeof audioTrackFormSchema>;

interface AudioTrackFormProps {
    bookId: string;
    onCancel: () => void;
}

export function AudioTrackForm({ bookId, onCancel }: AudioTrackFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { audiobook, loading, error, saveAudiobook } = useAudiobook({ bookId });
    const [fileName, setFileName] = useState<string>('');

    // Set default values for the form
    const defaultValues: AudioTrackFormValues = {
        audio_filename: '',
        media_id: audiobook?.media_id || null,
        audio_length: audiobook?.audio_length || null,
        publishing_date: audiobook?.publishing_date || null,
    };

    const form = useForm<AudioTrackFormValues>({
        resolver: zodResolver(audioTrackFormSchema),
        defaultValues,
    });

    // Update form values when audiobook data is loaded
    useEffect(() => {
        if (audiobook) {
            form.setValue('media_id', audiobook.media_id || null);
            form.setValue('audio_length', audiobook.audio_length || null);
            form.setValue('publishing_date', audiobook.publishing_date || null);
        }
    }, [audiobook, form]);

    // Watch audio_filename to enable/disable Publish button
    const audioFilename = form.watch('audio_filename');

    // Handle form submission
    const onSubmit = async (values: AudioTrackFormValues) => {
        setIsSubmitting(true);
        try {
            await saveAudiobook({
                audio_filename: values.audio_filename,
                media_id: values.media_id ?? null,
                audio_length: values.audio_length ?? null,
                publishing_date: values.publishing_date ?? null,
            });
            form.reset(values);
        } catch (error) {
            console.error('Error saving audio track:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle publish (to be implemented later)
    const handlePublish = () => {
        // Will be implemented later
        alert('Publish feature will be implemented later');
    };

    if (loading && !audiobook) {
        return <div>Loading audio track data...</div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="audio_filename"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Audio Filename</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="audio_file.mp3"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormDescription>
                                The filename of the audio file in assets/audios folder
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="media_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Media ID</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Media ID"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="audio_length"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Audio Length (seconds)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Audio length in seconds"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value ? parseInt(value, 10) : null);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="publishing_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Publishing Date</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="YYYY-MM-DD"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
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
                    <Button
                        type="button"
                        onClick={handlePublish}
                        disabled={!audioFilename}
                    >
                        Publish
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
