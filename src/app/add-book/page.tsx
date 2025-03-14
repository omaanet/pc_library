'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookForm } from '@/components/temp/books/book-form';
import { BookTable } from '@/components/temp/books/book-table';
import { AudioTrackForm } from '@/components/temp/books/audio-track-form';
import { useBooks } from '@/hooks/temp/use-books';
import { Book } from '@/types';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AddBookPage() {
    // const router = useRouter();
    const [activeTab, setActiveTab] = useState('manage');
    const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAudioTracks, setShowAudioTracks] = useState(false);

    const {
        books,
        loading,
        createBook,
        updateBook,
        deleteBook,
        fetchBooks
    } = useBooks();

    // Check if we should show audio tracks tab
    useEffect(() => {
        setShowAudioTracks(editingBook?.hasAudio || false);
    }, [editingBook]);

    // Handle form submission
    const handleSubmit = async (values: z.infer<any>) => {
        console.log('handleSubmit - Form values:', values);
        setIsSubmitting(true);

        try {
            // Format the date to ISO string
            const formattedValues = {
                ...values,
                publishingDate: values.publishingDate.toISOString(),
            };

            if (editingBook) {
                const bookId = editingBook?.id || '0';
                console.log(`Updating book with ID: ${bookId}`, formattedValues);
                // Update existing book
                await updateBook(bookId, formattedValues);
                console.log('Book updated successfully');
            } else {
                console.log('Creating new book', formattedValues);
                // Create new book
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
    const handleEdit = (book: Book) => {
        setEditingBook(book);
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
                <h1 className="text-3xl font-bold tracking-tight">Book Management</h1>
                <Button asChild variant="outline">
                    <Link href="/">
                        Go Back to Home
                    </Link>
                </Button>
            </div>

            <p className="text-muted-foreground mt-2">
                Add, edit, and manage books in the library.
            </p>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="manage">Manage Books</TabsTrigger>
                    <TabsTrigger value="add">{editingBook ? 'Edit Book' : 'Add Book'}</TabsTrigger>
                    {showAudioTracks && editingBook && (
                        <TabsTrigger value="audio-tracks">Audio Tracks</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="manage" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Books Library</CardTitle>
                            <CardDescription>
                                View and manage all books in the database.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BookTable
                                books={books}
                                onEdit={handleEdit}
                                onDelete={deleteBook}
                                onRefresh={fetchBooks}
                                isLoading={loading}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="add" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</CardTitle>
                            <CardDescription>
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
                                <CardTitle>Audio Tracks for "{editingBook.title}"</CardTitle>
                                <CardDescription>
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
            </Tabs>
        </div>
    );
}
