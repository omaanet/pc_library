/**
 * Current Application Types
 * 
 * These are the actively used type definitions in the current version.
 * Future feature types have been moved to ./future-features.ts
 */

import type { PromoTemplate } from '@/lib/promo-page-input';
import type { AdminRole } from '@/config/admin-roles';
import type { UserPreferences } from './preferences';

export type { UserPreferences } from './preferences';

export interface Book {
    id: string;
    title: string;
    coverImage: string;
    publishingDate: string;
    summary?: string;
    hasAudio: boolean;
    audioLength?: number; // Kept for backward compatibility
    extract?: string;
    rating?: number;
    isPreview?: boolean;
    isNew?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    displayOrder?: number;
    readonly isVisible?: number;
    isReadingVisible: boolean;
    isAudioVisible: boolean;
    pagesCount?: number;
    replaceFirstPageWithCopyrightOverride?: boolean | null;
    audiobook?: AudioBookInfo;

    // Preview media (Mux) fields stored on books table
    mediaId?: string | null;
    mediaTitle?: string | null;
    mediaUid?: string | null;
    previewPlacement?: 'left' | 'right' | null;

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
    intro_audio_override?: boolean;
    intro_audio_title?: string | null;
    intro_audio_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * A promo audio page: a hidden, slug-addressable marketing page that presents a
 * single promotional audio track for a linked book. Stores only promo-specific
 * data; book metadata (title, extract, cover, ...) is read from the books table.
 */
export interface PromoPage {
    id: number;
    bookId: string;
    slug: string;
    mediaId: string | null;
    audioLength: number | null;
    isActive: boolean;
    template: PromoTemplate;
    publishingDateOverride: string | null;
    audioType: string;
    createdAt?: string;
    updatedAt?: string;
}

/** Promo page row enriched with the linked book's title for admin listing. */
export interface PromoPageListItem extends PromoPage {
    bookTitle: string | null;
}

export interface User {
    id: number;
    email: string;
    fullName: string; // maps to full_name in DB
    isActivated: boolean; // maps to is_activated in DB
    isAdmin?: boolean;
    userLevel?: AdminRole;
    name: string; // Derived from fullName
    // The following fields are optional as they might not be present in all contexts
    verification_token?: string;
    password_hash?: string;
    preferences?: UserPreferences; // Joined from user_preferences table
    stats?: UserStats; // Joined from user_stats table
    createdAt?: Date; // maps to created_at in DB
    updatedAt?: Date; // maps to updated_at in DB
}

export interface BookResponse {
    books: Book[];
    pagination?: {
        total: number;
        page: number;
        perPage: number;
        hasMore: boolean;
        totalPages: number;
    };
}

// Import future feature types for type references
// Note: These are not re-exported to keep them out of the bundle
import type { UserStats, AudioBookInfo } from './future-features';
