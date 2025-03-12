'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookForm } from '@/components/temp/books/book-form';
import { BookTable } from '@/components/temp/books/book-table';
import { useBooks } from '@/hooks/temp/use-books';
import { Book } from '@/types';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AddBookPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('manage');
    const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        books,
        loading,
        createBook,
        updateBook,
        deleteBook,
        fetchBooks
    } = useBooks();

    // Handle form submission
    const handleSubmit = async (values: z.infer<any>) => {
        setIsSubmitting(true);

        try {
            // Format the date to ISO string
            const formattedValues = {
                ...values,
                publishingDate: values.publishingDate.toISOString(),
            };

            if (editingBook) {
                // Update existing book
                await updateBook(editingBook.id, formattedValues);
            } else {
                // Create new book
                await createBook(formattedValues);
            }

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
        if (activeTab === 'add') {
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
            </Tabs>
        </div>
    );
}
