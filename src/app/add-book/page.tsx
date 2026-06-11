'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookForm } from '@/components/admin/books/book-form';
import { BookTable } from '@/components/admin/books/book-table';
import { AudioTrackForm } from '@/components/admin/books/audio-track-form';
import { UsersTable } from '@/components/admin/users-table';
import { useBooks } from '@/hooks/admin/use-books';
import { Book } from '@/types';
import { z } from 'zod';
import Link from 'next/link';
import { IMAGE_CONFIG } from '@/lib/image-utils';

// Book form validation schema (matches BookForm component schema)
const bookFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    coverImage: z.string().default(IMAGE_CONFIG.placeholder.token),
    pagesCount: z.number().int().min(1).optional(),
    replaceFirstPageWithCopyrightOverride: z.boolean().nullable().optional(),
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
    isNew: z.boolean().default(false),
    isReadingVisible: z.boolean().default(true),
    isAudioVisible: z.boolean().default(false),
    audiobook: z.object({
        mediaId: z.string().nullable().optional(),
        introAudioOverride: z.boolean().default(false),
        introAudioTitle: z.string().nullable().optional(),
        introAudioId: z.string().nullable().optional()
    }).optional(),
    mediaId: z.string().nullable().optional(),
    mediaTitle: z.string().nullable().optional(),
    mediaUid: z.string().nullable().optional(),
    previewPlacement: z.string().nullable().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;
type TopLevelTab = 'manage' | 'add' | 'users' | 'test';
type AdminView = TopLevelTab | 'edit' | 'audio-tracks';
type SortField = 'title' | 'publishingDate' | 'hasAudio' | 'isPreview' | 'isNew' | 'book_id' | 'displayOrder' | 'isReadingVisible' | 'isAudioVisible';
type SortDirection = 'asc' | 'desc';

interface ManageViewState {
    scrollY: number;
    searchTerm: string;
    showAudioOnly: boolean;
    sortField: SortField;
    sortDirection: SortDirection;
}

const TOP_LEVEL_TABS = new Set<TopLevelTab>(['manage', 'add', 'users', 'test']);

function getTopLevelTab(value: string | null): TopLevelTab {
    return value && TOP_LEVEL_TABS.has(value as TopLevelTab)
        ? value as TopLevelTab
        : 'manage';
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { ArrowLeft } from 'lucide-react';
import { AdminAccessDenied } from '@/components/auth/admin-access-denied';
import { AuthModal } from '@/components/auth/auth-modal';

function AddBookPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { state } = useAuth();
    const searchParamsString = searchParams.toString();
    const rawTab = searchParams.get('tab');
    const requestedTopLevelTab = getTopLevelTab(rawTab);
    const [activeView, setActiveView] = useState<AdminView>(requestedTopLevelTab);
    const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const manageViewStateRef = useRef<ManageViewState | null>(null);
    const pendingScrollRestoreRef = useRef<number | null>(null);

    // Filter and sorting state
    const [searchTerm, setSearchTerm] = useState('');
    const [showAudioOnly, setShowAudioOnly] = useState(false);
    const [sortField, setSortField] = useState<SortField>('title');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Test mail and env state
    const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({});
    const [to, setTo] = useState('oscar@omaa.it');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sendResult, setSendResult] = useState<string | null>(null);

    const {
        books,
        loading,
        fetchBooks,
        createBook,
        updateBook,
        deleteBook
    } = useBooks();

    useEffect(() => {
        if (rawTab !== requestedTopLevelTab) {
            const params = new URLSearchParams(searchParamsString);
            params.set('tab', requestedTopLevelTab);
            router.replace(`/add-book?${params.toString()}`, { scroll: false });
        }

        setEditingBook(undefined);
        setActiveView(requestedTopLevelTab);
    }, [rawTab, requestedTopLevelTab, router, searchParamsString]);

    // Admin authorization check - requires both admin status and userLevel > 1
    useEffect(() => {
        if (!state.isLoading) {
            if (!state.isAuthenticated || !state.user?.isAdmin || (state.user?.userLevel ?? 0) <= 1) {
                router.push('/');
            }
        }
    }, [state.isAuthenticated, state.user, state.isLoading, router]);

    useEffect(() => {
        if (activeView !== 'manage' || pendingScrollRestoreRef.current === null) {
            return;
        }

        const scrollY = pendingScrollRestoreRef.current;
        pendingScrollRestoreRef.current = null;
        let secondFrame = 0;
        const firstFrame = window.requestAnimationFrame(() => {
            secondFrame = window.requestAnimationFrame(() => {
                window.scrollTo({ top: scrollY, behavior: 'auto' });
            });
        });

        return () => {
            window.cancelAnimationFrame(firstFrame);
            if (secondFrame) {
                window.cancelAnimationFrame(secondFrame);
            }
        };
    }, [activeView]);

    const replaceTopLevelTab = (tab: TopLevelTab) => {
        const params = new URLSearchParams(searchParamsString);
        params.set('tab', tab);
        router.replace(`/add-book?${params.toString()}`, { scroll: false });
    };

    const captureManageViewState = () => {
        manageViewStateRef.current = {
            scrollY: window.scrollY,
            searchTerm,
            showAudioOnly,
            sortField,
            sortDirection,
        };
    };

    const navigateToTopLevelTab = (tab: TopLevelTab) => {
        setEditingBook(undefined);
        setActiveView(tab);
        replaceTopLevelTab(tab);
    };

    const returnToManageBooks = () => {
        const previousState = manageViewStateRef.current;

        if (previousState) {
            setSearchTerm(previousState.searchTerm);
            setShowAudioOnly(previousState.showAudioOnly);
            setSortField(previousState.sortField);
            setSortDirection(previousState.sortDirection);
            pendingScrollRestoreRef.current = previousState.scrollY;
        }

        navigateToTopLevelTab('manage');
    };

    // Handle form submission
    const handleSubmit = async (values: BookFormValues) => {
        // console.log('handleSubmit - Form values:', values);
        setIsSubmitting(true);

        try {
            // Format the date to ISO string and convert null to undefined for optional fields
            const formattedValues = {
                ...values,
                publishingDate: values.publishingDate.toISOString(),
                audioLength: values.audioLength ?? undefined,
                displayOrder: values.displayOrder ?? undefined,
                rating: values.rating ?? undefined,
                summary: values.summary ?? undefined,
                extract: values.extract ?? undefined,
                mediaId: values.mediaId ?? undefined,
                mediaTitle: values.mediaTitle ?? undefined,
                mediaUid: values.mediaUid ?? undefined,
                previewPlacement: (values.previewPlacement as 'left' | 'right' | null | undefined) ?? undefined,
                replaceFirstPageWithCopyrightOverride: values.replaceFirstPageWithCopyrightOverride ?? null,
                isReadingVisible: values.isReadingVisible,
                isAudioVisible: values.hasAudio && values.isAudioVisible,
                audiobook: values.audiobook ? {
                    mediaId: values.audiobook.mediaId ?? null,
                    introAudioOverride: values.audiobook.introAudioOverride ?? false,
                    introAudioTitle: values.audiobook.introAudioTitle ?? null,
                    introAudioId: values.audiobook.introAudioId ?? null
                } : undefined,
            };

            // If editingBook exists and has an ID, update it. Otherwise, create a new book
            if (editingBook?.id) {
                console.log(`Updating book with ID: ${editingBook.id}`, formattedValues);
                // Update existing book
                const updatedBook = await updateBook(editingBook.id, formattedValues);
                if (!updatedBook) {
                    return;
                }
                console.log('Book updated successfully');
            } else {
                console.log('Creating new book', formattedValues);
                // Create new book (including cloned books)
                const createdBook = await createBook(formattedValues);
                if (!createdBook) {
                    return;
                }
                console.log('Book created successfully');
            }

            // Refresh the book list
            await fetchBooks();

            if (activeView === 'edit' || activeView === 'audio-tracks') {
                returnToManageBooks();
            } else {
                navigateToTopLevelTab('manage');
            }
        } catch (error) {
            console.error('Error saving book:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit button click
    const handleEdit = async (book: Book) => {
        captureManageViewState();
        setIsSubmitting(true); // Show loading state

        try {
            // Fetch complete book data to ensure we have audiobook.mediaId
            const response = await fetch(`/api/books/${book.id}`);
            if (!response.ok) {
                throw new Error(`Error fetching book details: ${response.status}`);
            }

            // The API returns the book directly, not wrapped in a data property
            const completeBook = await response.json();
            console.log('Fetched complete book data:', completeBook);
            setEditingBook(completeBook);
            setActiveView('edit');
        } catch (error) {
            console.error('Error preparing book for edit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle clone book
    const handleClone = (book: Book) => {
        captureManageViewState();
        // Create a copy of the book and remove the ID to ensure it's treated as a new book
        const { id, ...bookWithoutId } = book;
        // Add " (Cloned)" to the title to indicate it's a clone
        const clonedBook: Omit<Book, 'id'> = {
            ...bookWithoutId,
            title: `${book.title} (Cloned)`,
            replaceFirstPageWithCopyrightOverride: null,
            audiobook: bookWithoutId.hasAudio
                ? (bookWithoutId.audiobook ?? {
                    mediaId: null,
                    introAudioOverride: false,
                    introAudioTitle: null,
                    introAudioId: null,
                })
                : bookWithoutId.audiobook,
        };
        // Set the cloned book for editing
        setEditingBook(clonedBook as Book);
        setActiveView('edit');
    };

    // Handle cancel button click
    const handleCancel = () => {
        if (activeView === 'edit' || activeView === 'audio-tracks') {
            returnToManageBooks();
        } else {
            navigateToTopLevelTab('manage');
        }
    };

    // Handle tab change
    const handleTabChange = (value: string) => {
        if (value === 'audio-tracks' && editingBook?.id && editingBook.hasAudio) {
            setActiveView('audio-tracks');
            return;
        }

        if (TOP_LEVEL_TABS.has(value as TopLevelTab)) {
            const tab = value as TopLevelTab;
            if (tab === 'manage' && (activeView === 'edit' || activeView === 'audio-tracks')) {
                returnToManageBooks();
            } else {
                navigateToTopLevelTab(tab);
            }
        }
    };

    const isNestedBookView = activeView === 'edit' || activeView === 'audio-tracks';
    const canManageAudioTracks = Boolean(editingBook?.id && editingBook.hasAudio);
    const isBackButtonDisabled = activeView === 'users' || activeView === 'test';

    const handleBackButton = () => {
        if (activeView === 'manage') {
            router.push('/');
        } else if (activeView === 'add') {
            navigateToTopLevelTab('manage');
        } else if (isNestedBookView) {
            returnToManageBooks();
        }
    };

    // Show loading state while checking authentication
    if (state.isLoading) {
        return (
            <div className="container mx-auto p-10 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Verifica autorizzazione...</p>
                </div>
            </div>
        );
    }

    // Don't render content if not authorized (only after loading is complete)
    if (!state.isAuthenticated || !state.user?.isAdmin) {
        return (
            <>
                <AdminAccessDenied 
                    action="gestire i libri" 
                    onAuthClick={() => setIsAuthModalOpen(true)}
                />
                <AuthModal
                    open={isAuthModalOpen}
                    onOpenChange={setIsAuthModalOpen}
                />
            </>
        );
    }

    return (
        <div className="container mx-auto p-10">
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackButton}
                    disabled={isBackButtonDisabled}
                    className="mr-2"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Indietro</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Book Management</h1>
                <Button asChild variant="outline" className="ml-auto">
                    <Link href="/" className="select-none">
                        Go Back to Home
                    </Link>
                </Button>
            </div>

            <p className="text-muted-foreground mt-2 select-none">
                Add, edit, and manage books in the library.
            </p>

            <Tabs value={activeView} onValueChange={handleTabChange} className="mt-8 space-y-4">
                <TabsList className="relative">
                    {/* Group 1: Main Tabs */}
                    <div className="inline-flex items-center rounded-md bg-muted p-1">
                        <TabsTrigger value="manage" className="select-none">Manage Books</TabsTrigger>
                        <TabsTrigger value="add" className="select-none">Add Book</TabsTrigger>
                        {canManageAudioTracks && editingBook && (
                            <TabsTrigger value="audio-tracks" className="select-none">Audio Tracks</TabsTrigger>
                        )}
                    </div>

                    {/* Group 2: Admin Tabs - visually separated */}
                    <div className="ml-2 inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-900/30 p-1">
                        <TabsTrigger
                            value="users"
                            className="select-none data-[state=active]:bg-amber-200 dark:data-[state=active]:bg-amber-800/50"
                        >
                            Registered Users
                        </TabsTrigger>
                        <TabsTrigger
                            value="test"
                            className="ml-5 select-none data-[state=active]:bg-amber-200 dark:data-[state=active]:bg-amber-800/50"
                        >
                            Test
                        </TabsTrigger>
                    </div>
                </TabsList>

                <TabsContent value="manage" className="space-y-4">
                    <Card>
                        <CardHeader className="px-0">
                            <CardTitle>Books Library</CardTitle>
                            <CardDescription className="select-none">
                                View and manage all books in the database.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <BookTable
                                books={books}
                                onEdit={handleEdit}
                                onClone={handleClone}
                                onDelete={deleteBook}
                                onRefresh={fetchBooks}
                                isLoading={loading}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                showAudioOnly={showAudioOnly}
                                setShowAudioOnly={setShowAudioOnly}
                                sortField={sortField}
                                setSortField={setSortField}
                                sortDirection={sortDirection}
                                setSortDirection={setSortDirection}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="select-none">Registered Users</CardTitle>
                            <CardDescription className="select-none">
                                View and manage all registered users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsersTable />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="add" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="select-none">Add New Book</CardTitle>
                            <CardDescription className="select-none">
                                Fill in the details to add a new book to the library.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BookForm
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                                isSubmitting={isSubmitting}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {editingBook && (
                    <TabsContent value="edit" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="select-none">
                                    {editingBook.id ? (
                                        <>
                                            Edit Book <span className="text-sm text-gray-500 ms-3">[<span className="font-bold text-cyan-400 mx-1">{editingBook.id}</span>]</span>
                                        </>
                                    ) : (
                                        'Clone Book'
                                    )}
                                </CardTitle>
                                <CardDescription className="select-none">
                                    {editingBook.id
                                        ? `Edit details for "${editingBook.title}"`
                                        : 'Review the copied details before adding the cloned book.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <BookForm
                                    book={editingBook}
                                    onSubmit={handleSubmit}
                                    onCancel={handleCancel}
                                    isSubmitting={isSubmitting}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {canManageAudioTracks && editingBook && (
                    <TabsContent value="audio-tracks" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="select-none">Audio Tracks for "{editingBook.title}"</CardTitle>
                                <CardDescription className="select-none">
                                    Manage audio tracks for this book.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AudioTrackForm
                                    bookId={editingBook.id}
                                    onCancel={handleCancel}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="test" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="select-none">Environment Variables</CardTitle>
                            <CardDescription className="select-none">All environment variables</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-sm">{JSON.stringify(envVars, null, 2)}</pre>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="select-none">Send Test Email</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={e => {
                                e.preventDefault();
                                fetch('/api/test', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ to, subject, message })
                                })
                                    .then(res => res.json())
                                    .then(data => setSendResult(data.status === 'SEND' ? 'SEND' : data.error));
                            }}>
                                <div className="space-y-2">
                                    <Input value={to} onChange={e => setTo(e.target.value)} placeholder="Recipient" />
                                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
                                    <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" />
                                    <Button type="submit">Send</Button>
                                </div>
                            </form>
                            <div className="flex flex-row gap-2 mt-4">
                                <Button type="button" variant="secondary" onClick={() => {
                                    setSendResult(null);
                                    fetch('/api/test?action=verify', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            to,
                                            fullName: 'Test User',
                                            token: 'dummy-token-123'
                                        })
                                    })
                                        .then(res => res.json())
                                        .then(data => setSendResult(data.status === 'SEND' ? 'Verification SENT' : data.error));
                                }}>Test sendVerificationEmail</Button>
                                <Button type="button" variant="secondary" onClick={() => {
                                    setSendResult(null);
                                    fetch('/api/test?action=welcome', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            to,
                                            fullName: 'Test User',
                                            password: 'test-password-xyz'
                                        })
                                    })
                                        .then(res => res.json())
                                        .then(data => setSendResult(data.status === 'SEND' ? 'Welcome SENT' : data.error));
                                }}>Test sendWelcomeEmail</Button>
                            </div>
                            {sendResult && <div className="mt-2">Result: {sendResult}</div>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function AddBookPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto p-10 flex items-center justify-center min-h-screen">
                <p className="text-lg text-muted-foreground">Caricamento...</p>
            </div>
        }>
            <AddBookPageContent />
        </Suspense>
    );
}
