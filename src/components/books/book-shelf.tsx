'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import type { Book } from '@/types';
import { BookGridCard } from './book-grid-card';
import { BookListCard } from './book-list-card';
import { BookDialog } from './book-dialog';
import { ViewSwitcher } from '@/components/shared/view-switcher';
import { AuthModal } from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';
import { AudioBook } from '@/types';

// Direct approach without context

interface BookShelfProps {
    books: Book[];
    onSelectBook: (book: Book) => void;
    className?: string;
}

export function BookShelf({ books, onSelectBook, className }: BookShelfProps) {
    const [view, setView] = React.useState<'grid' | 'list'>('grid');
    const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);
    const [selectedAudioBook, setSelectedAudioBook] = React.useState<AudioBook | null>(null);
    const { state: { isAuthenticated } } = useAuth();

    // Handle auth modal state
    const [showAuthModal, setShowAuthModal] = React.useState(false);
    
    // Log state changes for debugging
    React.useEffect(() => {
        console.log('[BookShelf] showAuthModal state changed:', showAuthModal);
    }, [showAuthModal]);

    const handleBookSelect = (book: Book) => {
        setSelectedBook(book);
        onSelectBook(book);
    };

    const handleBookAction = () => {
        console.log('[BookShelf] handleBookAction called');
        console.log('[BookShelf] Current modal state:', showAuthModal);
        setShowAuthModal(true);
        console.log('[BookShelf] Set modal state to true');
    };
    


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Library Collection
                </h2>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            console.log('[BookShelf] Test button clicked, current state:', showAuthModal);
                            setShowAuthModal(true);
                        }}
                    >
                        Test Auth Modal
                    </Button>
                    <ViewSwitcher view={view} onViewChange={setView} />
                </div>
            </div>

            {view === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {books.map((book) => (
                        <BookGridCard
                            key={book.id}
                            book={book}
                            onSelect={handleBookSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="divide-y rounded-lg border bg-card">
                    {books.map((book) => (
                        <BookListCard
                            key={book.id}
                            book={book}
                            onSelect={handleBookSelect}
                        />
                    ))}
                </div>
            )}

            {/* Book Dialog */}
            <BookDialog
                book={selectedBook}
                open={!!selectedBook}
                onOpenChange={(open) => !open && setSelectedBook(null)}
                isAuthenticated={isAuthenticated}
                onLoginClick={handleBookAction}
            />
            
            {/* Auth Modal */}
            <AuthModal
                open={showAuthModal}
                onOpenChange={setShowAuthModal}
                defaultTab="login"
            />
        </div>
    );
}