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
    isPreview?: boolean;
    createdAt?: Date;
    updatedAt?: Date;

    // Application-specific fields
    readingProgress?: number;
    status?: 'unread' | 'reading' | 'completed' | 'on-hold';
}

export interface AudioBook {
    id: number;
    book_id: string;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
    created_at?: string;
    updated_at?: string;
}
