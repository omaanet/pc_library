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

// Collapsible, lazy replies
function CommentThread({
    comments,
    onReply,
    replyingToId,
    isAuthenticated,
    onLoginClick,
    bookId,
    registerReplyHandler,
    parentId,
}: {
    comments: (Comment & { repliesCount?: number })[];
    onReply: (parentId: string | null) => void;
    replyingToId: string | null;
    isAuthenticated: boolean;
    onLoginClick?: () => void;
    bookId: string;
    registerReplyHandler?: (parentId: string, handler: (reply: Comment) => void) => void;
    parentId?: string;
}) {
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
    const [replies, setReplies] = React.useState<Record<string, { loading: boolean; data: (Comment & { repliesCount: number })[] }>>({});

    const handleToggleReplies = async (comment: Comment & { repliesCount?: number }) => {
        setExpanded(prev => ({ ...prev, [comment.id]: !prev[comment.id] }));
        if (!expanded[comment.id] && replies[comment.id]?.data == null) {
            setReplies(prev => ({ ...prev, [comment.id]: { loading: true, data: [] } }));
            try {
                const res = await fetch(`/api/books/${bookId}/replies?parentId=${comment.id}`);
                const json = await res.json();
                setReplies(prev => ({ ...prev, [comment.id]: { loading: false, data: (json.replies || []).map((r: any) => ({ ...r, repliesCount: typeof r.repliesCount === 'number' ? r.repliesCount : 0 })) } }));
            } catch {
                setReplies(prev => ({ ...prev, [comment.id]: { loading: false, data: [] } }));
            }
        }
    };

    // Register this thread's reply handler with the parent
    React.useEffect(() => {
        if (registerReplyHandler && parentId) {
            registerReplyHandler(parentId, (reply: Comment) => {
                setReplies(prev => {
                    if (prev[parentId]) {
                        const safeReply = {
                            ...reply,
                            repliesCount: typeof reply.repliesCount === 'number' ? reply.repliesCount : 0
                        };
                        return {
                            ...prev,
                            [parentId]: {
                                ...prev[parentId],
                                data: [safeReply, ...(prev[parentId].data || [])]
                            }
                        };
                    }
                    return prev;
                });
            });
        }
    }, [registerReplyHandler, parentId]);

    return (
        <ul className="space-y-4">
            {comments.map(comment => (
                <li key={comment.id} className="flex gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-lg font-semibold text-white select-none">
                            {comment.userName ? comment.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                        </div>
                    </div>
                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-x-2 mb-0.5">
                            <div className="text-sm text-zinc-900 dark:text-zinc-200 font-medium">{comment.userName}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-300">{new Date(comment.createdAt).toLocaleString("it-IT")}</div>
                            {comment.isAdmin ? (
                                <div className="flex items-center ml-2 text-xs text-yellow-500 font-medium"><Shield className="h-4 w-4 mr-1" />Admin</div>
                            ) : null}
                        </div>
                        
                        <div className="whitespace-pre-line text-base mt-3 mb-2 text-gray-800 dark:text-gray-100">{comment.content}</div>

                        {/* Actions Row */}
                        <div className="flex items-center gap-2 mb-1">
                            {/* <Button variant="ghost" size="icon" className="rounded-full p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Like" tabIndex={-1}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-6 0v4" /><path d="M5 15V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" /></svg></Button>
                            <Button variant="ghost" size="icon" className="rounded-full p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Dislike" tabIndex={-1}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 6 0v-4" /><path d="M19 9v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg></Button> */}
                            {isAuthenticated && (
                                <Button variant="ghost" size="sm" className="ps-0 pe-2 py-0 mb-0 text-xs text-teal-600 dark:text-teal-500 font-normal" onClick={() => onReply(comment.id)}>
                                    Rispondi
                                </Button>
                            )}
                            {!isAuthenticated && (
                                <Button variant="ghost" size="sm" className="ps-0 pe-2 py-0 mb-0 text-xs text-teal-600 dark:text-teal-500 font-normal" onClick={onLoginClick}>Accedi per rispondere</Button>
                            )}

                            {/* Replies button */}
                            {typeof comment.repliesCount === 'number' && comment.repliesCount > 0 && (
                                <Button
                                    variant="ghost" size="sm"
                                    className="ps-0 pe-2 py-0 mb-0 text-xs text-green-600 dark:text-green-500 font-normal"
                                    onClick={() => handleToggleReplies(comment)}
                                    aria-expanded={!!expanded[comment.id]}
                                >
                                    {expanded[comment.id] ? 'Nascondi' : 'Mostra'} {comment.repliesCount} rispost{comment.repliesCount !== 1 ? 'e' : 'a'}
                                </Button>
                            )}
                        </div>

                        {/* Replies */}
                        {expanded[comment.id] && (
                            <div className="ml-6 mt-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4 bg-gray-50 dark:bg-gray-900/40 rounded">
                                {replies[comment.id]?.loading ? (
                                    <div className="text-xs text-muted-foreground">Caricamento risposte...</div>
                                ) : (
                                    replies[comment.id]?.data && (
                                        <CommentThread
                                            comments={replies[comment.id]?.data || []}
                                            onReply={onReply}
                                            replyingToId={replyingToId}
                                            isAuthenticated={isAuthenticated}
                                            onLoginClick={onLoginClick}
                                            bookId={bookId}
                                            registerReplyHandler={registerReplyHandler}
                                            parentId={comment.id}
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function BookComments({ bookId, isAuthenticated, userName, onLoginClick }: BookCommentsProps) {
    const [comments, setComments] = React.useState<Comment[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [newComment, setNewComment] = React.useState('');
    const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
    const [posting, setPosting] = React.useState(false);
    const { toast } = useToast();
    const [replies, setReplies] = React.useState<Record<string, { loading: boolean; data: (Comment & { repliesCount: number })[] }>>({});
    const replyHandlerMap = React.useRef(new Map<string, (reply: Comment) => void>()).current;
    const registerReplyHandler = React.useCallback((parentId: string, handler: (reply: Comment) => void) => {
        replyHandlerMap.set(parentId, handler);
    }, []);

    // Fetch comments
    React.useEffect(() => {
        setLoading(true);
        fetch(`/api/books/${bookId}/comments`)
            .then(res => res.json())
            .then(data => {
                setComments(data.comments || []);
                setLoading(false);
            })
            .catch(() => {
                setError('Errore durante il caricamento dei commenti');
                setLoading(false);
            });
    }, [bookId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setPosting(true);
        setError(null);
        try {
            const res = await fetch(`/api/books/${bookId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ content: newComment, parentId: replyingTo }),
            });
            if (!res.ok) throw new Error('Errore durante l\'invio del commento');
            const data = await res.json();
            setNewComment('');
            setReplyingTo(null);
            if (replyingTo) {
                // Increment repliesCount in comments
                setComments(prevComments => prevComments.map(comment =>
                    comment.id === replyingTo
                        ? { ...comment, repliesCount: (comment.repliesCount || 0) + 1 }
                        : comment
                ));
                // Add reply to expanded thread if possible
                const handler = replyHandlerMap.get(replyingTo);
                if (handler) handler(data.comment);
            } else {
                // Add new top-level comment
                setComments(prevComments => [data.comment, ...prevComments]);
            }
            toast({ title: 'Commento aggiunto!' });
        } catch (err) {
            setError('Errore durante l\'invio del commento');
        } finally {
            setPosting(false);
        }
    };

    const handleReply = (parentId: string | null) => {
        setReplyingTo(parentId);
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex-1 min-h-0 overflow-auto">
                {loading ? (
                    <div className="text-muted-foreground">Caricamento commenti...</div>
                ) : error ? (
                    <div className="text-red-600">{error}</div>
                ) : (
                    <>
                        {comments.length === 0 ? (
                            <div className="text-muted-foreground mb-4">Nessun commento ancora. Sii il primo a commentare!</div>
                        ) : (
                            <CommentThread
                                comments={comments}
                                onReply={handleReply}
                                replyingToId={replyingTo}
                                isAuthenticated={isAuthenticated}
                                onLoginClick={onLoginClick}
                                bookId={bookId}
                                registerReplyHandler={registerReplyHandler}
                                parentId={undefined}
                            />
                        )}
                    </>
                )}
            </div>
            <form onSubmit={handleSubmit} className="pt-2 space-y-2 bg-background shrink-0">
                {replyingTo && (
                    <div className="text-xs text-teal-600 dark:text-teal-500 mb-1">
                        Rispondendo a un commento
                        <Button type="button" variant="link" size="sm" className="ml-2 p-0 text-red-600 dark:text-red-500 h-auto" onClick={() => setReplyingTo(null)}>
                            Annulla
                        </Button>
                    </div>
                )}
                <Textarea
                    placeholder={
                        isAuthenticated
                            ? replyingTo
                                ? 'Scrivi una risposta...'
                                : 'Scrivi un commento...'
                            : 'Accedi per commentare'
                    }
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    disabled={!isAuthenticated || posting}
                />
                <div>
                    {isAuthenticated && (
                        <Button type="submit" disabled={posting || !newComment.trim()}>
                            {posting ? 'Invio...' : 'Invia commento'}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
