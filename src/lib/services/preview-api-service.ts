import type { PublicBookPreview } from '@/types/book-preview';

export async function fetchPreviews(signal?: AbortSignal): Promise<PublicBookPreview[]> {
    const response = await fetch('/api/previews', { cache: 'no-store', signal });
    if (!response.ok) throw new Error('Impossibile caricare le anteprime');
    return (await response.json()).previews;
}

export async function previewRequest(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    if (options.method && options.method !== 'GET') {
        const tokenResponse = await fetch('/api/csrf-token', { cache: 'no-store' });
        if (!tokenResponse.ok) throw new Error('Impossibile verificare la sessione');
        headers.set('x-csrf-token', (await tokenResponse.json()).token);
    }
    const response = await fetch(url, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Operazione non riuscita');
    return data;
}
