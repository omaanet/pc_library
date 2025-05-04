'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import {
    Pencil,
    Trash2,
    Headphones,
    ChevronUp,
    ChevronDown,
    Search,
    RefreshCw,
    Eye,
    Check,
    Upload
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

type SortField = 'title' | 'publishingDate' | 'hasAudio' | 'isPreview';
type SortDirection = 'asc' | 'desc';

export function BookTable({ books, onEdit, onDelete, onRefresh, isLoading }: BookTableProps) {
    const [epubExists, setEpubExists] = useState<{ [bookId: string]: boolean }>({});
    const [epubLoading, setEpubLoading] = useState<{ [bookId: string]: boolean }>({});
    const [docxDialogBook, setDocxDialogBook] = useState<Book | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        books.forEach(book => {
            if (!book.hasAudio && epubExists[book.id] === undefined && !epubLoading[book.id]) {
                setEpubLoading(prev => ({ ...prev, [book.id]: true }));
                fetch(`/epub/${book.id}/output.epub`, { method: 'HEAD' })
                    .then(res => setEpubExists(prev => ({ ...prev, [book.id]: res.ok })))
                    .catch(() => setEpubExists(prev => ({ ...prev, [book.id]: false })))
                    .finally(() => setEpubLoading(prev => ({ ...prev, [book.id]: false })));
            }
        });
    }, [books, epubExists, epubLoading]);

    // Optimized: Fetch EPUB existence for all relevant books at once
    React.useEffect(() => {
        const relevantBooks = books.filter(book => !book.hasAudio && epubExists[book.id] === undefined);
        if (relevantBooks.length === 0) return;
        const bookIds = relevantBooks.map(book => book.id);
        setEpubLoading(prev => ({ ...prev, ...Object.fromEntries(bookIds.map(id => [id, true])) }));
        fetch('/api/epub_exists/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookIds }),
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.exists) {
                    setEpubExists(prev => ({ ...prev, ...data.exists }));
                }
            })
            .catch(() => {
                setEpubExists(prev => ({ ...prev, ...Object.fromEntries(bookIds.map(id => [id, false])) }));
            })
            .finally(() => {
                setEpubLoading(prev => ({ ...prev, ...Object.fromEntries(bookIds.map(id => [id, false])) }));
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [books]);
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

    // Memoize filter and sort logic and pre-calc normalized search term
    const searchTermLower = searchTerm.toLowerCase();
    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            const title = (book.title || '').toLowerCase();
            const summary = (book.summary || '').toLowerCase();
            const matchesSearch = searchTermLower === '' || title.includes(searchTermLower) || summary.includes(searchTermLower);
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
            } else if (sortField === 'isPreview') {
                return sortDirection === 'asc'
                    ? (a.isPreview ? 1 : 0) - (b.isPreview ? 1 : 0)
                    : (b.isPreview ? 1 : 0) - (a.isPreview ? 1 : 0);
            }
            return 0;
        });
    }, [books, searchTermLower, showAudioOnly, sortField, sortDirection]);

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
                            <TableHead className="text-sm">book_id</TableHead>
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
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1 p-0 font-medium"
                                    onClick={() => handleSort('isPreview')}
                                >
                                    Preview {getSortIcon('isPreview')}
                                </Button>
                            </TableHead>
                            <TableHead>Epub</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBooks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    {isLoading ? 'Loading books...' : 'No books found.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBooks.map((book) => (
                                <TableRow key={book.id}>
                                    <TableCell className="text-sm">{book.id}</TableCell>
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
                                    <TableCell>
                                        {book.isPreview ? (
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-4 w-4" />
                                                <span>Preview</span>
                                            </div>
                                        ) : 'No'}
                                    </TableCell>
                                    <TableCell>
                                        {/* EPUB column: Only for books with no audio */}
                                        {!book.hasAudio ? (
                                            epubLoading[book.id] ? (
                                                <span className="text-muted-foreground">...</span>
                                            ) : epubExists[book.id] ? (
                                                <Check className="h-5 w-5 text-green-600" aria-label="EPUB present" />
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setDocxDialogBook(book)}
                                            >
                                                <Upload className="h-4 w-4" />
                                            </Button>
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

            <Dialog open={!!docxDialogBook} onOpenChange={() => { setDocxDialogBook(null); setSelectedFile(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-cyan-600">Upload DOCX</DialogTitle>
                        <DialogDescription>{docxDialogBook?.title}</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center px-2">
                        <input
                            className="file:border-0 file:bg-teal-600 file:text-white file:font-medium file:text-sm file:px-3 file:py-2 file:rounded-md file:cursor-pointer"
                            type="file"
                            accept=".docx"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            disabled={uploading}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setDocxDialogBook(null); setSelectedFile(null); }} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            className="bg-pink-500 text-white hover:bg-pink-400 disabled:bg-pink-700/70 disabled:text-gray-200"
                            onClick={async () => {
                                if (!selectedFile || !docxDialogBook) return;
                                setUploading(true);
                                const formData = new FormData();
                                formData.append('file', selectedFile);
                                formData.append('title', docxDialogBook.title);
                                try {
                                    const res = await fetch(`/api/docx-to-epub/${docxDialogBook.id}`, { method: 'POST', body: formData });
                                    const data = await res.json();
                                    if (data.success) {
                                        // Use API response to update EPUB existence
                                        setEpubExists(prev => ({ ...prev, [docxDialogBook.id!]: data.exists }));
                                    } else {
                                        console.error(data.error);
                                    }
                                } catch (err) {
                                    console.error(err);
                                } finally {
                                    setUploading(false);
                                    setDocxDialogBook(null);
                                    setSelectedFile(null);
                                }
                            }}
                            disabled={!selectedFile || uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}