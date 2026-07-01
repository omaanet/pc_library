import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PromoPageClassicBurgundyView } from '@/components/promo/PromoPageClassicBurgundyView';
import { PromoPageClassicEcruView } from '@/components/promo/PromoPageClassicEcruView';
import { PromoPageClassicGreenView } from '@/components/promo/PromoPageClassicGreenView';
import { PromoPageModernView } from '@/components/promo/PromoPageModernView';
import { PromoPageView } from '@/components/promo/PromoPageView';
import { requireManagedPageAccess } from '@/lib/admin-auth';
import { getBookById, getPromoPageById } from '@/lib/db';
import {
    DEFAULT_PROMO_AUDIO_TYPE,
    PROMO_TEMPLATES,
    type PromoTemplate,
} from '@/lib/promo-page-input';
import type { PromoPage } from '@/types';

type PreviewSearchParams = Record<string, string | string[] | undefined>;

interface PreviewPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<PreviewSearchParams>;
}

export const metadata: Metadata = {
    title: 'Anteprima pagina promo',
    robots: { index: false, follow: false },
};

function getSingleParam(searchParams: PreviewSearchParams, key: string): string | undefined {
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0];
    return value;
}

function parsePreviewId(value: string): number | null {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function parseNullableString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function parseAudioLength(value: string): number | null | undefined {
    if (value.trim().length === 0) return null;

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return Math.floor(parsed);
}

function parseBoolean(value: string): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
}

function parseTemplate(value: string): PromoTemplate | undefined {
    return (PROMO_TEMPLATES as readonly string[]).includes(value)
        ? (value as PromoTemplate)
        : undefined;
}

function parseDateOnly(value: string): string | null | undefined {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) return undefined;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return undefined;
    }

    return trimmed;
}

function applyDraftParams(
    savedPromoPage: PromoPage,
    searchParams: PreviewSearchParams
): PromoPage | null {
    const draft: PromoPage = { ...savedPromoPage };

    const bookId = getSingleParam(searchParams, 'bookId');
    if (bookId !== undefined) {
        const parsed = parseNullableString(bookId);
        if (!parsed) return null;
        draft.bookId = parsed;
    }

    const mediaId = getSingleParam(searchParams, 'mediaId');
    if (mediaId !== undefined) {
        draft.mediaId = parseNullableString(mediaId);
    }

    const audioLength = getSingleParam(searchParams, 'audioLength');
    if (audioLength !== undefined) {
        const parsed = parseAudioLength(audioLength);
        if (parsed === undefined) return null;
        draft.audioLength = parsed;
    }

    const isActive = getSingleParam(searchParams, 'isActive');
    if (isActive !== undefined) {
        const parsed = parseBoolean(isActive);
        if (parsed === undefined) return null;
        draft.isActive = parsed;
    }

    const template = getSingleParam(searchParams, 'template');
    if (template !== undefined) {
        const parsed = parseTemplate(template);
        if (!parsed) return null;
        draft.template = parsed;
    }

    const publishingDateOverride = getSingleParam(searchParams, 'publishingDateOverride');
    if (publishingDateOverride !== undefined) {
        const parsed = parseDateOnly(publishingDateOverride);
        if (parsed === undefined) return null;
        draft.publishingDateOverride = parsed;
    }

    const audioType = getSingleParam(searchParams, 'audioType');
    if (audioType !== undefined) {
        draft.audioType = parseNullableString(audioType) ?? DEFAULT_PROMO_AUDIO_TYPE;
    }

    return draft;
}

export default async function PromoPagePreview({ params, searchParams }: PreviewPageProps) {
    try {
        await requireManagedPageAccess('promo-pages');
    } catch {
        notFound();
    }

    const [{ id: rawId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
    const id = parsePreviewId(rawId);
    if (!id) notFound();

    const savedPromoPage = await getPromoPageById(id);
    if (!savedPromoPage) notFound();

    const promoPage = applyDraftParams(savedPromoPage, resolvedSearchParams);
    if (!promoPage) notFound();

    const book = await getBookById(promoPage.bookId);
    if (!book) notFound();

    if (promoPage.template === 'modern') {
        return <PromoPageModernView promoPage={promoPage} book={book} disableTracking />;
    }

    if (promoPage.template === 'classic-green') {
        return <PromoPageClassicGreenView promoPage={promoPage} book={book} disableTracking />;
    }

    if (promoPage.template === 'classic-burgundy') {
        return <PromoPageClassicBurgundyView promoPage={promoPage} book={book} disableTracking />;
    }

    if (promoPage.template === 'classic-ecru') {
        return <PromoPageClassicEcruView promoPage={promoPage} book={book} disableTracking />;
    }

    return <PromoPageView promoPage={promoPage} book={book} disableTracking />;
}
