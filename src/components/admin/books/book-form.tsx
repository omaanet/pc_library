'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookFormSchema, getBookFormValues, getBookFormErrorMessages, type BookFormValues } from '@/lib/book-form-values';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { BOOK_GENRES } from '@/lib/book-genres';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { BookPreviewEditor, type BookPreviewEditorHandle } from '@/components/admin/books/book-preview-editor';
import { CoverImagePicker } from '@/components/admin/books/cover-image-picker';
import {
    isAnyVersionVisible,
    setAllVersionsVisible,
} from '@/lib/book-visibility';

const MIN_PUBLISHING_DATE = new Date(1900, 0, 1);

interface BookFormProps {
    book?: Book;
    onSubmit: (values: BookFormValues, options?: { close?: boolean }) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function BookForm({ book, onSubmit, onCancel, isSubmitting: parentSubmitting }: BookFormProps) {
    const previewEditorRef = React.useRef<BookPreviewEditorHandle>(null);
    const savingRef = React.useRef(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const isSubmitting = parentSubmitting || saving;
    const defaultValues = React.useMemo(() => getBookFormValues(book), [book]);
    const [isPublishingDateOpen, setIsPublishingDateOpen] = useState(false);
    const [publishingMonth, setPublishingMonth] = useState(defaultValues.publishingDate);

    const form = useForm<BookFormValues>({
        resolver: zodResolver(bookFormSchema),
        defaultValues,
        mode: "onBlur",
    });

    // The parent replaces this baseline only when switching books or after a save.
    // Background auth renders keep the same book and leave in-progress edits intact.
    const { reset } = form;
    useEffect(() => {
        reset(defaultValues);
        setPublishingMonth(defaultValues.publishingDate);
        setSaveError('');
    }, [defaultValues, reset]);

    const hasAudio = form.watch('hasAudio');
    const showAudioLength = hasAudio;
    const coverImage = form.watch('coverImage');
    const isReadingVisible = form.watch('isReadingVisible');
    const isAudioVisible = form.watch('isAudioVisible');
    const validationMessages = getBookFormErrorMessages(form.formState.errors);

    const visibility = { hasAudio, isReadingVisible, isAudioVisible };
    const anyVersionVisible = isAnyVersionVisible(visibility);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toggleAllAvailableVersions = (visible: boolean) => {
        const next = setAllVersionsVisible(visibility, visible);
        form.setValue('isReadingVisible', next.isReadingVisible, { shouldDirty: true });
        form.setValue('isAudioVisible', next.isAudioVisible, { shouldDirty: true });
    };

    // Save the preview before the parent is allowed to close the editor.
    const handleSubmit = async (data: BookFormValues, options?: { close?: boolean }) => {
        if (savingRef.current || parentSubmitting) return;
        savingRef.current = true;
        setSaving(true);
        setSaveError('');
        try {
            // Persist the entire preview before the parent can close/unmount the editor.
            // A collapsed preview still has to save any pending changes.
            await previewEditorRef.current?.save(!data.isPreview);
            await onSubmit(data, options);
        } catch (error) {
            setSaveError((error as Error).message);
            console.error("Error submitting form:", error);
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit(values => handleSubmit(values, { close: true }))}
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

                <div className="grid grid-cols-2 items-start gap-3">
                <FormField
                    control={form.control}
                    name="publishingDate"
                    render={({ field }) => (
                        <FormItem className="flex min-w-0 flex-col">
                            <FormLabel>Publishing Date</FormLabel>
                            <Popover
                                open={isPublishingDateOpen}
                                onOpenChange={(open) => {
                                    setIsPublishingDateOpen(open);
                                    if (open) {
                                        setPublishingMonth(field.value || today);
                                    }
                                }}
                            >
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            type="button"
                                            variant={"outline"}
                                            className={cn(
                                                "h-auto min-h-10 w-full gap-2 whitespace-normal pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                <span className="min-w-0 break-words">{format(field.value, "PPP")}</span>
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0"
                                    align="start"
                                    sideOffset={8}
                                    collisionPadding={16}
                                >
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        month={publishingMonth}
                                        onMonthChange={setPublishingMonth}
                                        onSelect={(date) => {
                                            if (!date) {
                                                return;
                                            }

                                            field.onChange(date);
                                            setPublishingMonth(date);
                                            setIsPublishingDateOpen(false);
                                        }}
                                        captionLayout="dropdown"
                                        reverseYears
                                        startMonth={MIN_PUBLISHING_DATE}
                                        endMonth={today}
                                        disabled={[
                                            { before: MIN_PUBLISHING_DATE },
                                            { after: today },
                                        ]}
                                        weekStartsOn={1}
                                        autoFocus
                                        aria-label="Publishing date"
                                    />
                                    <div className="border-t p-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                field.onChange(today);
                                                setPublishingMonth(today);
                                                setIsPublishingDateOpen(false);
                                            }}
                                        >
                                            Today
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="genres"
                    render={({ field }) => (
                        <FormItem className="flex min-w-0 flex-col">
                            <FormLabel>Genere</FormLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <FormControl>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            disabled={isSubmitting}
                                            className="h-auto min-h-10 w-full justify-between gap-2 whitespace-normal text-left font-normal"
                                        >
                                            <span className="min-w-0 break-words">
                                                {field.value.length ? field.value.join(', ') : 'Seleziona un genere'}
                                            </span>
                                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" collisionPadding={16} className="max-w-[calc(100vw-2rem)]">
                                    {BOOK_GENRES.map((genre) => (
                                        <DropdownMenuCheckboxItem
                                            key={genre}
                                            checked={field.value.includes(genre)}
                                            onSelect={(event) => event.preventDefault()}
                                            onCheckedChange={(checked) => {
                                                const next = checked
                                                    ? [...field.value, genre]
                                                    : field.value.filter((value) => value !== genre);
                                                form.setValue('genres', BOOK_GENRES.filter((value) => next.includes(value)), {
                                                    shouldDirty: true,
                                                    shouldTouch: true,
                                                    shouldValidate: true,
                                                });
                                            }}
                                            className="whitespace-normal"
                                        >
                                            {genre}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                </div>

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
                                <CoverImagePicker
                                    ref={field.ref}
                                    name={field.name}
                                    onBlur={field.onBlur}
                                    placeholder="Cover image path"
                                    value={field.value || ''}
                                    onValueChange={field.onChange}
                                    bookId={book?.id}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormDescription>
                                Carica un'immagine, inserisci un percorso libero oppure scegli una copertina dal server. Usa {IMAGE_CONFIG.placeholder.token} per un'immagine segnaposto.
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
                    name="replaceFirstPageWithCopyrightOverride"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prima pagina copyright</FormLabel>
                            <Select
                                value={
                                    field.value === true
                                        ? 'replace'
                                        : field.value === false
                                            ? 'original'
                                            : 'global'
                                }
                                onValueChange={(value) => {
                                    field.onChange(
                                        value === 'replace'
                                            ? true
                                            : value === 'original'
                                                ? false
                                                : null
                                    );
                                }}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full sm:w-[320px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="global">Usa impostazione globale</SelectItem>
                                    <SelectItem value="replace">Sostituisci prima pagina</SelectItem>
                                    <SelectItem value="original">Usa prima pagina originale</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Override per il lettore immagini; globale usa la configurazione del sito.
                            </FormDescription>
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
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            form.setValue('isAudioVisible', false, { shouldDirty: true });
                                        }}
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
                                    <FormField
                                        control={form.control}
                                        name="audiobook.introAudioOverride"
                                        render={({ field: introOverrideField }) => (
                                            <FormItem className={`space-y-4 rounded-lg border p-4 transition-colors ${introOverrideField.value ? 'border-primary/50' : 'border-border/60'}`}>
                                                <div className="flex flex-row items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Custom Intro Audio</FormLabel>
                                                        <FormDescription>
                                                            Override the default intro track used as the first audio track
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={introOverrideField.value}
                                                            onCheckedChange={introOverrideField.onChange}
                                                            className="data-[state=checked]:bg-green-500"
                                                        />
                                                    </FormControl>
                                                </div>

                                                {introOverrideField.value && (
                                                    <div className="space-y-4">
                                                        <FormField
                                                            control={form.control}
                                                            name="audiobook.introAudioTitle"
                                                            render={({ field: titleField }) => (
                                                                <FormItem>
                                                                    <FormLabel>Title</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Intro track title"
                                                                            value={titleField.value || ''}
                                                                            onChange={(e) => titleField.onChange(e.target.value || null)}
                                                                            className="w-full"
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name="audiobook.introAudioId"
                                                            render={({ field: introIdField }) => (
                                                                <FormItem>
                                                                    <FormLabel>IntroAudioID</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Wasabi intro audio object key"
                                                                            value={introIdField.value || ''}
                                                                            onChange={(e) => introIdField.onChange(e.target.value || null)}
                                                                            className="w-full"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription>
                                                                        Stored verbatim in the intro audio URL path
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
                                </div>
                            )}
                        </FormItem>
                    )}
                />

                <FormField control={form.control} name="isPreview" render={({ field }) => (
                    <FormItem className={`space-y-4 rounded-lg border-2 p-4 transition-colors ${field.value ? 'border-primary/50' : 'border-border'}`}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Preview Book</FormLabel>
                                <FormDescription>Esclude il libro dalla biblioteca ordinaria. I contenuti e la visibilità dell’anteprima si configurano qui sotto, indipendentemente da questo flag.</FormDescription>
                            </div>
                            <FormControl><Switch className="shrink-0 data-[state=checked]:bg-green-500" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </div>
                        <FormMessage />
                        <div hidden={!field.value} className="sm:ms-10">
                            {book?.id ? <BookPreviewEditor key={book.id} ref={previewEditorRef} book={book} bookCover={coverImage} disabled={isSubmitting} /> : <p className="border-t pt-4 text-sm text-muted-foreground">Salva prima il libro: potrai poi configurare qui copertina, video ed estratto dell’anteprima.</p>}
                        </div>
                    </FormItem>
                )} />
                <div className={`space-y-4 rounded-lg border-2 p-4 transition-colors ${anyVersionVisible ? 'border-primary/50' : 'border-border'}`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base" htmlFor="visible-to-users">Visible to Users</FormLabel>
                            <FormDescription>
                                Bulk control for all available versions. Turn it off to hide every version at once.
                            </FormDescription>
                        </div>
                        <Switch
                            id="visible-to-users"
                            aria-controls="visible-to-users-fields"
                            aria-expanded={anyVersionVisible}
                            checked={anyVersionVisible}
                            onCheckedChange={toggleAllAvailableVersions}
                            className="shrink-0 data-[state=checked]:bg-green-500"
                        />
                    </div>

                    <div id="visible-to-users-fields" hidden={!anyVersionVisible} className="ms-6 space-y-3 border-s ps-4">
                        <FormField
                            control={form.control}
                            name="isReadingVisible"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>Visible reading version</FormLabel>
                                        <FormDescription>
                                            Temporarily publish or hide the online reader, PDF download, and PDF request.
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
                            name="isAudioVisible"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>Visible audio version</FormLabel>
                                        <FormDescription>
                                            Temporarily publish or hide audio without deleting its media configuration.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={hasAudio && field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={!hasAudio}
                                            className="data-[state=checked]:bg-green-500"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="isNew"
                    render={({ field }) => (
                        <FormItem className={`flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-colors ${field.value ? 'border-primary/50' : 'border-border'}`}>
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Is New</FormLabel>
                                <FormDescription>
                                    Force this book to show the NEW badge. When off, the badge is based on publishing date.
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

                {validationMessages.length > 0 && (
                    <div role="alert" className="text-destructive">
                        <p>Controlla i campi prima di salvare:</p>
                        <ul className="list-disc pl-5">
                            {validationMessages.map(message => <li key={message}>{message}</li>)}
                        </ul>
                    </div>
                )}
                {saveError && <p role="alert" className="text-destructive">Salvataggio non completato: {saveError}</p>}
                <div className="flex flex-wrap justify-end gap-4">
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
                        onClick={form.handleSubmit(values => handleSubmit(values, { close: false }))}
                        className="select-none"
                    >
                        {isSubmitting ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
                    </ThemedButton>
                    {book?.id && (
                        <ThemedButton
                            type="button"
                            disabled={isSubmitting}
                            color="green"
                            variant="outline"
                            onClick={form.handleSubmit(values => handleSubmit(values, { close: true }))}
                            className="select-none"
                        >
                            {isSubmitting ? 'Saving...' : 'Update & close'}
                        </ThemedButton>
                    )}
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
