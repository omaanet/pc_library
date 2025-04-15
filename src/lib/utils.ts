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