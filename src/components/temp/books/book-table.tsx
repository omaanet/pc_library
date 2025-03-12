'use client';

import * as React from 'react';
import { useState } from 'react';
import {
    Pencil,
    Trash2,
    Headphones,
    ChevronUp,
    ChevronDown,
    Search,
    RefreshCw
} from 'lucide-react';
import { formatDate, formatAudioLength } from '@/lib/utils';
import { getCoverImageUrl } from '@/lib/image-utils';
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
    onDelete: (id: string) => Promise<boolean>;
    onRefresh: () => void;
    isLoading: boolean;
}

type SortField = 'title' | 'publishingDate' | 'hasAudio';
type SortDirection = 'asc' | 'desc';

export function BookTable({ books, onEdit, onDelete, onRefresh, isLoading }: BookTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAudioOnly, setShowAudioOnly] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sortField, setSortField] = useState<SortField>('title');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Handle sorting
    const handleSort = (field: SortField) => {
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
    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    };

    // Filter and sort books
    const filteredBooks = books.filter(book => {
        // Apply search filter
        const matchesSearch = searchTerm === '' ||
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.summary.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply audio filter
        const matchesAudio = !showAudioOnly || book.hasAudio;

        return matchesSearch && matchesAudio;
    }).sort((a, b) => {
        // Apply sorting
        if (sortField === 'title') {
            return sortDirection === 'asc'
                ? a.title.localeCompare(b.title)
                : b.title.localeCompare(a.title);
        } else if (sortField === 'publishingDate') {
            const dateA = new Date(a.publishingDate).getTime();
            const dateB = new Date(b.publishingDate).getTime();
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (sortField === 'hasAudio') {
            return sortDirection === 'asc'
                ? (a.hasAudio ? 1 : 0) - (b.hasAudio ? 1 : 0)
                : (b.hasAudio ? 1 : 0) - (a.hasAudio ? 1 : 0);
        }
        return 0;
    });

    // Handle delete confirmation
    const confirmDelete = (book: Book) => {
        setBookToDelete(book);
        setDeleteDialogOpen(true);
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
                        placeholder="Search books..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="audio-filter"
                            checked={showAudioOnly}
                            onCheckedChange={setShowAudioOnly}
                        />
                        <Label htmlFor="audio-filter">Audio books only</Label>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium"
                                    onClick={() => handleSort('title')}
                                >
                                    Title {getSortIcon('title')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium"
                                    onClick={() => handleSort('publishingDate')}
                                >
                                    Published {getSortIcon('publishingDate')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium"
                                    onClick={() => handleSort('hasAudio')}
                                >
                                    Audio {getSortIcon('hasAudio')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBooks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    {isLoading ? 'Loading books...' : 'No books found.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBooks.map((book) => (
                                <TableRow key={book.id}>
                                    <TableCell className="font-medium">{book.title}</TableCell>
                                    <TableCell>{formatDate(book.publishingDate)}</TableCell>
                                    <TableCell>
                                        {book.hasAudio ? (
                                            <div className="flex items-center gap-1">
                                                <Headphones className="h-4 w-4" />
                                                {book.audioLength ? formatAudioLength(book.audioLength) : 'Yes'}
                                            </div>
                                        ) : 'No'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => onEdit(book)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => confirmDelete(book)}
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
