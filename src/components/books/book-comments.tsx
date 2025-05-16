// src/components/books/book-comments.tsx
'use client';

import * as React from 'react';
import { Shield } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { Comment } from '@/types/comment';

interface BookCommentsProps {
    bookId: string;
    isAuthenticated: boolean;
    userName?: string;
    onLoginClick?: () => void;
}

export default function BookComments({ bookId, isAuthenticated, userName, onLoginClick }: BookCommentsProps) {
    const [comments, setComments] = React.useState<Comment[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
    const [newComment, setNewComment] = React.useState('');
    const { toast } = useToast();

    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
    const [replies, setReplies] = React.useState<Record<string, Comment[]>>({});
    const [loadingReplies, setLoadingReplies] = React.useState<Record<string, boolean>>({});

    const listRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setLoading(true);
        fetch(`/api/books/${bookId}/comments`)
            .then(res => res.json())
            .then(json => setComments(json.comments || []))
            .catch(() => setError('Errore nel caricamento dei commenti'))
            .finally(() => setLoading(false));
    }, [bookId]);

    const handleToggleExpand = React.useCallback(async (commentId: string) => {
        const isOpen = !!expanded[commentId];
        if (!isOpen && !replies[commentId]) {
            setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
            try {
                const res = await fetch(`/api/books/${bookId}/replies?parentId=${commentId}`);
                const json = await res.json();
                setReplies(prev => ({ ...prev, [commentId]: json.replies || [] }));
            } catch {
                setReplies(prev => ({ ...prev, [commentId]: [] }));
            } finally {
                setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
            }
        }
        setExpanded(prev => ({ ...prev, [commentId]: !isOpen }));
    }, [bookId, expanded, replies]);

    const handleReplyInsert = React.useCallback((parentId: string, newReply: Comment) => {
        setComments(prev => prev.map(c => c.id === parentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c));
        setExpanded(prev => ({ ...prev, [parentId]: true }));
        setReplies(prev => ({ ...prev, [parentId]: prev[parentId] ? [...prev[parentId], newReply] : [newReply] }));
        // Scroll the new reply into view
        setTimeout(() => {
            const el = document.getElementById(newReply.id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const res = await fetch(`/api/books/${bookId}/comments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
                body: JSON.stringify({ content: newComment, parentId: replyingTo })
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setNewComment('');
            setReplyingTo(null);
            if (replyingTo) {
                handleReplyInsert(replyingTo, data.comment);
            } else {
                setComments(prev => [...prev, data.comment]);
                // scroll to bottom after adding new comment
                setTimeout(() => {
                    if (listRef.current) {
                        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
                    }
                }, 100);
            }
            toast({ title: 'Commento aggiunto!' });
        } catch {
            setError('Errore durante l\'invio del commento');
        }
    };

    const handleReplyClick = React.useCallback((id: string | null) => setReplyingTo(id), []);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-auto" ref={listRef}>
                {loading ? <div className="text-muted-foreground">Caricamento commenti...</div>
                    : error ? <div className="text-red-600">{error}</div>
                        : (comments.length === 0 ? (
                            <div className="text-muted-foreground mt-2 px-2">{isAuthenticated ? 'Lascia un commento!' : 'Lascia un commento!!'}</div>
                        )
                            : <CommentThread
                                comments={comments}
                                expanded={expanded}
                                replies={replies}
                                loadingReplies={loadingReplies}
                                onToggleExpand={handleToggleExpand}
                                onReply={handleReplyClick}
                                replyingToId={replyingTo}
                                onReplyInsert={handleReplyInsert}
                                isAuthenticated={isAuthenticated}
                                onLoginClick={onLoginClick}
                                bookId={bookId}
                            />
                        )}
            </div>
            {isAuthenticated && (
                <form onSubmit={handleSubmit} className="pt-2 space-y-2 shrink-0">
                    {replyingTo && <div className="text-xs text-teal-600 mb-1">
                        Rispondendo a un commento
                        <Button type="button" variant="link" size="sm" className="ml-2 p-0 text-red-600" onClick={() => setReplyingTo(null)}>Annulla</Button>
                    </div>}
                    <Textarea
                        placeholder={replyingTo ? 'Scrivi una risposta...' : 'Scrivi il tuo commento qui...'}
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                    />
                    <Button type="submit" disabled={!newComment.trim()} className="select-none">Invia commento</Button>
                </form>
            )}
        </div>
    );
}

interface CommentThreadProps {
    comments: (Comment & { repliesCount?: number })[];
    expanded: Record<string, boolean>;
    replies: Record<string, Comment[]>;
    loadingReplies: Record<string, boolean>;
    onToggleExpand: (commentId: string) => void;
    onReply: (parentId: string | null) => void;
    replyingToId: string | null;
    onReplyInsert: (parentId: string, newReply: Comment) => void;
    isAuthenticated: boolean;
    onLoginClick?: () => void;
    bookId: string;
}

function CommentThread({ comments, expanded, replies, loadingReplies, onToggleExpand, onReply, replyingToId, onReplyInsert, isAuthenticated, onLoginClick, bookId }: CommentThreadProps) {
    return (
        <ul className="space-y-4 mt-3">
            {comments.map(comment => (
                <li id={comment.id} key={comment.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-lg font-semibold text-white">
                            {comment.userName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-baseline gap-x-2 mb-0.5">
                            <div className="text-sm font-medium">{comment.userName}</div>
                            <div className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString('it-IT')}</div>
                        </div>
                        <p className="text-sm mb-1">{comment.content}</p>
                        <div className="flex items-center gap-2 mb-1">
                            {isAuthenticated
                                ? <Button variant="ghost" size="sm" className="ps-0 pe-2 text-xs text-teal-600" onClick={() => onReply(comment.id)}>Rispondi</Button>
                                : <Button variant="ghost" size="sm" className="ps-0 pe-2 text-xs text-teal-600" onClick={onLoginClick}>Accedi per rispondere</Button>
                            }
                            {(comment.repliesCount || 0) > 0 && <Button variant="ghost" size="sm" className="ps-0 pe-2 text-xs text-green-600" onClick={() => onToggleExpand(comment.id)} aria-expanded={expanded[comment.id] || false}>
                                {expanded[comment.id] ? 'Nascondi' : 'Mostra'} {comment.repliesCount} rispost{comment.repliesCount !== 1 ? 'e' : 'a'}
                            </Button>}
                        </div>
                        {expanded[comment.id] && (
                            <div className="ml-0 mt-3 border-l-2 pl-4">
                                {loadingReplies[comment.id]
                                    ? <div className="text-xs text-muted-foreground">Caricamento risposte...</div>
                                    : <CommentThread
                                        comments={replies[comment.id] || []}
                                        expanded={expanded}
                                        replies={replies}
                                        loadingReplies={loadingReplies}
                                        onToggleExpand={onToggleExpand}
                                        onReply={onReply}
                                        replyingToId={replyingToId}
                                        onReplyInsert={onReplyInsert}
                                        isAuthenticated={isAuthenticated}
                                        onLoginClick={onLoginClick}
                                        bookId={bookId}
                                    />
                                }
                            </div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
