'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookForm } from '@/components/temp/books/book-form';
import { BookTable } from '@/components/temp/books/book-table';
import { AudioTrackForm } from '@/components/temp/books/audio-track-form';
import { UsersTable } from '@/components/admin/users-table';
import { useBooks } from '@/hooks/temp/use-books';
import { Book } from '@/types';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function AddBookPage() {
    // const router = useRouter();
    // const { state, dispatch } = useAuth();
    const [activeTab, setActiveTab] = useState('manage');
    const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAudioTracks, setShowAudioTracks] = useState(false);

    // Filter and sorting state
    const [searchTerm, setSearchTerm] = useState('');
    const [showAudioOnly, setShowAudioOnly] = useState(false);
    const [sortField, setSortField] = useState<'title' | 'publishingDate' | 'hasAudio' | 'isPreview' | 'book_id' | 'displayOrder' | 'isVisible'>('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Test mail and env state
    const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({});
    const [to, setTo] = useState('oscar@omaa.it');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sendResult, setSendResult] = useState<string | null>(null);

    const {
        books,
        loading,
        error,
        fetchBooks,
        createBook,
        updateBook,
        deleteBook
    } = useBooks();

    // Check if we should show audio tracks tab
    useEffect(() => {
        setShowAudioTracks(editingBook?.hasAudio || false);
    }, [editingBook]);

    useEffect(() => {
        if (activeTab === 'test') {
            fetch('/api/test')
                .then(res => res.json())
                .then(data => setEnvVars(data));
        }
    }, [activeTab]);

    // Handle form submission
    const handleSubmit = async (values: z.infer<any>) => {
        // console.log('handleSubmit - Form values:', values);
        setIsSubmitting(true);

        try {
            // Format the date to ISO string
            const formattedValues = {
                ...values,
                publishingDate: values.publishingDate.toISOString(),
            };

            // If editingBook exists and has an ID, update it. Otherwise, create a new book
            if (editingBook?.id) {
                console.log(`Updating book with ID: ${editingBook.id}`, formattedValues);
                // Update existing book
                await updateBook(editingBook.id, formattedValues);
                console.log('Book updated successfully');
            } else {
                console.log('Creating new book', formattedValues);
                // Create new book (including cloned books)
                await createBook(formattedValues);
                console.log('Book created successfully');
            }

            // Refresh the book list
            await fetchBooks();

            // Reset form and switch to manage tab
            setEditingBook(undefined);
            setActiveTab('manage');
        } catch (error) {
            console.error('Error saving book:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit button click
    const handleEdit = async (book: Book, isClone = false) => {
        setIsSubmitting(true); // Show loading state

        try {
            if (isClone) {
                // Create a shallow copy of the book and remove the ID to ensure it's treated as a new book
                const { id, ...bookWithoutId } = book;
                setEditingBook(bookWithoutId as Book);
            } else {
                // Fetch complete book data to ensure we have audiobook.mediaId
                const response = await fetch(`/api/books/${book.id}`);
                if (!response.ok) {
                    throw new Error(`Error fetching book details: ${response.status}`);
                }

                // The API returns the book directly, not wrapped in a data property
                const completeBook = await response.json();
                console.log('Fetched complete book data:', completeBook);
                setEditingBook(completeBook);
            }
        } catch (error) {
            console.error('Error preparing book for edit:', error);
        } finally {
            setIsSubmitting(false);
            setActiveTab('add');
        }
    };

    // Handle clone book
    const handleClone = (book: Book) => {
        // Create a deep copy of the book and remove the ID to ensure it's treated as a new book
        const { id, ...bookWithoutId } = JSON.parse(JSON.stringify(book));
        // Add " (Cloned)" to the title to indicate it's a clone
        bookWithoutId.title = `${book.title} (Cloned)`;
        // Set the cloned book for editing
        setEditingBook(bookWithoutId as Book);
        setActiveTab('add');
    };

    // Handle cancel button click
    const handleCancel = () => {
        setEditingBook(undefined);
        if (activeTab === 'add' || activeTab === 'audio-tracks') {
            setActiveTab('manage');
        }
    };

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (value === 'manage') {
            setEditingBook(undefined);
        }
    };

    return (
        <div className="container mx-auto p-10">
            <div className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight select-none">Book Management</h1>
                <Button asChild variant="outline">
                    <Link href="/" className="select-none">
                        Go Back to Home
                    </Link>
                </Button>
            </div>

            <p className="text-muted-foreground mt-2 select-none">
                Add, edit, and manage books in the library.
            </p>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList className="relative">
                    {/* Group 1: Main Tabs */}
                    <div className="inline-flex items-center rounded-md bg-muted p-1">
                        <TabsTrigger value="manage" className="select-none">Manage Books</TabsTrigger>
                        <TabsTrigger value="add" className="select-none">
                            {editingBook ? 'Edit Book' : 'Add Book'}
                        </TabsTrigger>
                        {showAudioTracks && editingBook && (
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
                        <CardHeader>
                            <CardTitle className="select-none">Books Library</CardTitle>
                            <CardDescription className="select-none">
                                View and manage all books in the database.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                            <CardTitle className="select-none">
                                {editingBook ? (
                                    <>
                                        Edit Book <span className="text-sm text-gray-500 ms-3">[<span className="font-bold text-cyan-400 mx-1">{editingBook.id}</span>]</span>
                                    </>
                                ) : (
                                    'Add New Book'
                                )}
                            </CardTitle>
                            <CardDescription className="select-none">
                                {editingBook
                                    ? `Edit details for "${editingBook.title}"`
                                    : 'Fill in the details to add a new book to the library.'}
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

                {showAudioTracks && editingBook && (
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
