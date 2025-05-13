// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
    const date = new Date(input);
    return date.toLocaleDateString('it-IT', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

export function formatAudioLength(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const remainingAfterHours = seconds % 3600;
    const minutes = Math.floor(remainingAfterHours / 60);
    const secs = remainingAfterHours % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    return password;
}

/**
 * Italian Title Normalization Module
 * 
 * This module provides functions to normalize Italian titles for use as filenames and URLs.
 * It handles common Italian language conventions like articles and accented characters.
 */

/**
 * Normalizes an Italian title for use as a filename or URL path
 * @param title - The original Italian title
 * @param extension - Optional file extension (default: 'pdf')
 * @returns The normalized filename
 */
export function normalizeItalianTitle(title: string, extension: string = 'pdf'): string {
    // Handle null or empty titles
    if (!title) return '';

    // Remove common Italian articles at the beginning
    title = title.replace(/^(il |lo |la |l'|gli |le |i |un |uno |una |un')/i, '');

    // Remove common Italian prepositions at the beginning after article removal
    title = title.replace(/^(di |a |da |in |con |su |per |tra |fra )/i, '');

    // Replace apostrophes with underscores
    title = title.replace(/['']/g, '_');

    // Normalize accented characters (common in Italian)
    title = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Replace spaces and redundant characters with underscores
    title = title.replace(/\s+/g, '_');

    // Remove invalid filename characters
    title = title.replace(/[/\\?%*:|"<>]/g, '');

    // Clean up punctuation (excess dots, commas, etc.)
    title = title.replace(/[,.;:!?]+/g, '_');

    // Remove redundant underscores and clean up
    title = title.replace(/_+/g, '_');            // Replace multiple underscores with a single one
    title = title.replace(/^_|_$/g, '');          // Remove leading/trailing underscores

    // Add extension if provided
    return extension ? `${title}.${extension}` : title;
}

/**
 * Type for the options that can be passed to the normalization function
 */
export interface NormalizationOptions {
    /** The file extension to append (default: 'pdf') */
    extension?: string;
    /** Whether to remove leading articles (default: true) */
    removeArticles?: boolean;
    /** Whether to remove leading prepositions (default: true) */
    removePrepositions?: boolean;
}

/**
 * Enhanced version of the normalizer that accepts options
 * @param title - The original Italian title
 * @param options - Normalization options
 * @returns The normalized filename
 */
export function normalizeItalianTitleWithOptions(
    title: string,
    options: NormalizationOptions = {}
): string {
    const {
        extension = 'pdf',
        removeArticles = true,
        removePrepositions = true
    } = options;

    // Handle null or empty titles
    if (!title) return '';

    // Remove common Italian articles at the beginning if enabled
    if (removeArticles) {
        title = title.replace(/^(il |lo |la |l'|gli |le |i |un |uno |una |un')/i, '');
    }

    // Remove common Italian prepositions at the beginning after article removal if enabled
    if (removePrepositions) {
        title = title.replace(/^(di |a |da |in |con |su |per |tra |fra )/i, '');
    }

    // Replace apostrophes with underscores
    title = title.replace(/['']/g, '_');

    // Normalize accented characters (common in Italian)
    title = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Replace spaces and redundant characters with underscores
    title = title.replace(/\s+/g, '_');

    // Remove invalid filename characters
    title = title.replace(/[/\\?%*:|"<>]/g, '');

    // Clean up punctuation (excess dots, commas, etc.)
    title = title.replace(/[,.;:!?]+/g, '_');

    // Remove redundant underscores and clean up
    title = title.replace(/_+/g, '_');            // Replace multiple underscores with a single one
    title = title.replace(/^_|_$/g, '');          // Remove leading/trailing underscores

    // Add extension if provided
    return extension ? `${title}.${extension}` : title;
}