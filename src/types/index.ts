export interface Book {
    id: string;
    title: string;
    coverImage: string;
    publishingDate: string;
    summary: string;
    hasAudio: boolean;
    audioLength?: number;
    extract?: string;
    rating?: number;
    createdAt: Date
    updatedAt: Date

    // Application-specific fields
    readingProgress?: number;
    status?: 'unread' | 'reading' | 'completed' | 'on-hold';
}
