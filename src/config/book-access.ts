export interface BookAccessSettings {
    requireAuthenticationForBookAccess: boolean;
}

export const DEFAULT_BOOK_ACCESS_SETTINGS: BookAccessSettings = {
    requireAuthenticationForBookAccess: true,
};

export function isBookAccessSettings(value: unknown): value is BookAccessSettings {
    if (!value || typeof value !== 'object') return false;

    return typeof (value as Record<string, unknown>).requireAuthenticationForBookAccess === 'boolean';
}
