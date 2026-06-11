'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
    Pencil,
    Trash2,
    Headphones,
    ChevronUp,
    ChevronDown,
    Search,
    RefreshCw,
    Eye,
    EyeOff,
    Copy,
    Sparkles,
    BookOpen,
    Download
} from 'lucide-react';
import { formatDate, isBookEffectivelyNew } from '@/lib/utils';
import {
    createBooksLibraryCsv,
    createBooksLibraryCsvFilename,
    getBooksLibraryRows,
    type BooksLibrarySortDirection,
    type BooksLibrarySortField,
} from '@/lib/books-library-csv';
import { downloadCsv } from '@/lib/csv';
import { Book } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface BookTableProps {
    books: Book[];
    onEdit: (book: Book) => void;
    onClone: (book: Book) => void;
    onDelete: (id: string) => Promise<boolean>;
    onRefresh: () => void;
    isLoading: boolean;

    // Props for external filter/sort state
    searchTerm?: string;
    setSearchTerm?: (term: string) => void;
    showAudioOnly?: boolean;
    setShowAudioOnly?: (show: boolean) => void;
    sortField?: BooksLibrarySortField;
    setSortField?: (field: BooksLibrarySortField) => void;
    sortDirection?: BooksLibrarySortDirection;
    setSortDirection?: (direction: BooksLibrarySortDirection) => void;
}

export function BookTable({
    books,
    onEdit,
    onClone,
    onDelete,
    onRefresh,
    isLoading,
    searchTerm: externalSearchTerm,
    setSearchTerm: externalSetSearchTerm,
    showAudioOnly: externalShowAudioOnly,
    setShowAudioOnly: externalSetShowAudioOnly,
    sortField: externalSortField,
    setSortField: externalSetSortField,
    sortDirection: externalSortDirection,
    setSortDirection: externalSetSortDirection
}: BookTableProps) {
    // Use local state when external state is not provided
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [localShowAudioOnly, setLocalShowAudioOnly] = useState(false);
    const [localSortField, setLocalSortField] = useState<BooksLibrarySortField>('title');
    const [localSortDirection, setLocalSortDirection] = useState<BooksLibrarySortDirection>('asc');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Use external state if provided, otherwise use local state
    const searchTerm = externalSetSearchTerm ? (externalSearchTerm ?? '') : localSearchTerm;
    const setSearchTerm = externalSetSearchTerm || setLocalSearchTerm;

    const showAudioOnly = externalSetShowAudioOnly ? (externalShowAudioOnly ?? false) : localShowAudioOnly;
    const setShowAudioOnly = externalSetShowAudioOnly || setLocalShowAudioOnly;

    const sortField = externalSetSortField ? (externalSortField ?? 'title') : localSortField;
    const setSortField = externalSetSortField || setLocalSortField;

    const sortDirection = externalSetSortDirection ? (externalSortDirection ?? 'asc') : localSortDirection;
    const setSortDirection = externalSetSortDirection || setLocalSortDirection;

    // Handle sorting
    const handleSort = (field: BooksLibrarySortField) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new field and default to ascending
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Get sort icon
    const getSortIcon = (field: BooksLibrarySortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    };

    // Keep the rendered and exported row set identical.
    const filteredBooks = useMemo(() => {
        return getBooksLibraryRows(books, {
            searchTerm,
            showAudioOnly,
            sortField,
            sortDirection,
            isBookNew: isBookEffectivelyNew,
        });
    }, [books, searchTerm, showAudioOnly, sortField, sortDirection]);

    const handleExportCsv = () => {
        const csv = createBooksLibraryCsv(filteredBooks, isBookEffectivelyNew);
        downloadCsv(csv, createBooksLibraryCsvFilename());
    };

    // Handle delete confirmation
    const confirmDelete = (book: Book) => {
        setBookToDelete(book);
        setDeleteDialogOpen(true);
    };

    const handleClone = (book: Book) => {
        const { id, ...bookWithoutId } = JSON.parse(JSON.stringify(book));
        bookWithoutId.title = `${book.title} (Copy)`;
        onClone(bookWithoutId as Book);
    };

    // Handle actual deletion
    const handleDelete = async () => {
        if (!bookToDelete) return;

        setIsDeleting(true);
        const success = await onDelete(bookToDelete.id);
        setIsDeleting(false);

        if (success) {
            setDeleteDialogOpen(false);
            setBookToDelete(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca racconti..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        lang="it"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2 select-none">
                        <Switch
                            id="audio-filter"
                            checked={showAudioOnly}
                            onCheckedChange={setShowAudioOnly}
                        />
                        <Label htmlFor="audio-filter">Solo audio raconti</Label>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportCsv}
                        disabled={isLoading || filteredBooks.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24 cursor-pointer select-none text-xs text-muted-foreground whitespace-nowrap" onClick={() => handleSort('book_id')}>
                                ID {getSortIcon('book_id')}
                            </TableHead>
                            <TableHead className="whitespace-nowrap" style={{ width: 'auto' }}>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium whitespace-nowrap w-full justify-start"
                                    onClick={() => handleSort('title')}
                                >
                                    Title {getSortIcon('title')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-xs text-muted-foreground">
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium text-xs text-muted-foreground"
                                    onClick={() => handleSort('publishingDate')}
                                >
                                    Published {getSortIcon('publishingDate')}
                                </Button>
                            </TableHead>

                            <TableHead className="text-xs text-muted-foreground text-center">
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium text-xs text-muted-foreground mx-auto"
                                    onClick={() => handleSort('hasAudio')}
                                >
                                    Audio {getSortIcon('hasAudio')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-xs text-muted-foreground text-center">
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium text-xs text-muted-foreground mx-auto"
                                    onClick={() => handleSort('isPreview')}
                                >
                                    Preview {getSortIcon('isPreview')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-xs text-muted-foreground text-center">
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium text-xs text-muted-foreground mx-auto"
                                    onClick={() => handleSort('isNew')}
                                >
                                    Is New {getSortIcon('isNew')}
                                </Button>
                            </TableHead>

                            <TableHead className="text-xs text-muted-foreground text-center cursor-pointer select-none" onClick={() => handleSort('displayOrder')}>
                                Display order {getSortIcon('displayOrder')}
                            </TableHead>
                            <TableHead className="text-xs text-muted-foreground text-center cursor-pointer select-none" onClick={() => handleSort('isReadingVisible')}>
                                Reading visible {getSortIcon('isReadingVisible')}
                            </TableHead>
                            <TableHead className="text-xs text-muted-foreground text-center cursor-pointer select-none" onClick={() => handleSort('isAudioVisible')}>
                                Audio visible {getSortIcon('isAudioVisible')}
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBooks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    {isLoading ? 'Loading books...' : 'No books found.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBooks.map((book) => (
                                <TableRow key={book.id}>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{book.id}</TableCell>
                                    <TableCell className="font-medium whitespace-nowrap flex-1 min-w-0" style={{ width: 'auto' }}>{book.title}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{formatDate(book.publishingDate)}</TableCell>

                                    <TableCell className="text-xs whitespace-nowrap text-center">
                                        {book.hasAudio ? (
                                            <Headphones className="h-4 w-4 text-muted-foreground mx-auto" />
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap text-center">
                                        {book.isPreview ? (
                                            <Eye className="h-4 w-4 text-muted-foreground mx-auto" />
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap text-center">
                                        {isBookEffectivelyNew(book) ? (
                                            <Sparkles className="h-4 w-4 text-muted-foreground mx-auto" aria-label="New" />
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap text-center">{book.displayOrder}</TableCell>
                                    <TableCell className="text-xs whitespace-nowrap text-center">
                                        {book.isReadingVisible
                                            ? <BookOpen className="h-4 w-4 text-green-600 mx-auto" aria-label="Reading visible" />
                                            : <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" aria-label="Reading hidden" />}
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap text-center">
                                        {!book.hasAudio ? (
                                            <span className="text-muted-foreground" aria-label="No audio version">-</span>
                                        ) : book.isAudioVisible ? (
                                            <Headphones className="h-4 w-4 text-green-600 mx-auto" aria-label="Audio visible" />
                                        ) : (
                                            <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" aria-label="Audio hidden" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(book);
                                                }}
                                                title="Edit book"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onClone(book);
                                                }}
                                                title="Clone book"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmDelete(book);
                                                }}
                                                className="text-destructive hover:text-destructive hover:border-destructive"
                                                title="Delete book"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{bookToDelete?.title}&quot;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
