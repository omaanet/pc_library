// Database type definitions for Neon/Postgres
export interface DatabaseUser {
    id: number;
    email: string;
    full_name: string;
    is_activated: boolean;
    verification_token: string | null;
    password_hash: string | null;
    is_admin: number;
    created_at: string;
    updated_at: string;
}

export interface DatabaseBook {
    id: number;
    title: string;
    cover_image: string | null;
    publishing_date: string | null;
    summary: string | null;
    has_audio: boolean;
    audio_length: number | null;
    audio_media_id: string | null;
    extract: string | null;
    rating: number | null;
    is_preview: boolean;
    display_order: number | null;
    pages_count: number | null;
    is_visible: number;
    created_at: string;
    updated_at: string;
}

export interface DatabaseAudioBook {
    id: number;
    book_id: number;
    media_id: string | null;
    audio_length: number | null;
    publishing_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface DatabaseComment {
    id: number;
    book_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface DatabaseReply {
    id: number;
    comment_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
}

// Neon client interface
export interface NeonClient {
    query<T = any>(sql: string, params?: any[]): Promise<NeonQueryResult<T>>;
}

// Neon client returns arrays directly, not objects with rows property
export type NeonQueryResult<T = any> = T[];

// Query parameter types
export type QueryParams = (string | number | boolean | null)[];

// Transaction interface
export interface DatabaseTransaction {
    query<T = any>(sql: string, params?: QueryParams): Promise<NeonQueryResult<T>>;
    rollback(): Promise<void>;
    commit(): Promise<void>;
}

// Database error codes
export const DATABASE_ERROR_CODES = {
    UNIQUE_VIOLATION: '23505',
    FOREIGN_KEY_VIOLATION: '23503',
    NOT_NULL_VIOLATION: '23502',
    CHECK_VIOLATION: '23514',
} as const;

// Type guards
export function isUniqueViolationError(error: any): error is { code: typeof DATABASE_ERROR_CODES.UNIQUE_VIOLATION } {
    return error?.code === DATABASE_ERROR_CODES.UNIQUE_VIOLATION;
}

export function isForeignKeyViolationError(error: any): error is { code: typeof DATABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION } {
    return error?.code === DATABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION;
}
