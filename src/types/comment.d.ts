// src/types/comment.d.ts
export interface Comment {
    id: string;
    bookId: string;
    userId: number;
    userName: string;
    isAdmin: boolean;
    content: string;
    parentId?: string | null;
    createdAt: string;
    // For frontend convenience (threaded structure)
    replies?: Comment[];
    // For frontend convenience (UI count of replies)
    repliesCount?: number;
}
