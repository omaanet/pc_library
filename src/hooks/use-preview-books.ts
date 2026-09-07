'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchPreviews } from '@/lib/services/preview-api-service';

export function usePreviewBooks() {
    const query = useQuery({ queryKey: ['book-previews'], queryFn: ({ signal }) => fetchPreviews(signal), staleTime: 0 });
    return { previews: query.data || [], loading: query.isPending, error: query.error?.message, retry: () => query.refetch() };
}
