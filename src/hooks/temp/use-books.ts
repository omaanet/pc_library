// src/hooks/temp/use-books.ts
import { useState, useEffect, useCallback } from 'react';
import { Book } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface UseBookOptions {
    initialRefetch?: boolean;
}

export function useBooks({ initialRefetch = true }: UseBookOptions = {}) {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/books?displayPreviews=-1&sortOrder=desc&isVisible=-1'); // &sortOrder=desc

            if (!response.ok) {
                throw new Error(`Error fetching books: ${response.status}`);
            }

            const data = await response.json();

            // New backend returns { data, pagination }
            setBooks(data.data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch books';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const createBook = useCallback(async (bookData: Omit<Book, 'id'>) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error creating book: ${response.status}`);
            }

            const { data: newBook } = await response.json();
            setBooks(prev => [...prev, newBook]);

            toast({
                title: 'Success',
                description: 'Book created successfully',
            });

            return newBook;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create book';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const updateBook = useCallback(async (id: string, bookData: Partial<Omit<Book, 'id'>>) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/books/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error updating book: ${response.status}`);
            }

            const { data: updatedBook } = await response.json();
            setBooks(prev => prev.map(book => book.id === id ? updatedBook : book));

            toast({
                title: 'Success',
                description: 'Book updated successfully',
            });

            return updatedBook;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update book';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const deleteBook = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/books/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error deleting book: ${response.status}`);
            }

            setBooks(prev => prev.filter(book => book.id !== id));

            toast({
                title: 'Success',
                description: 'Book deleted successfully',
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete book';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (initialRefetch) {
            fetchBooks();
        }
    }, [fetchBooks, initialRefetch]);

    return {
        books,
        loading,
        error,
        fetchBooks,
        createBook,
        updateBook,
        deleteBook,
    };
}
