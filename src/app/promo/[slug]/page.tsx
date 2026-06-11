import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPromoPageBySlug, getBookById } from '@/lib/db';
import { siteOrigin, siteTitle } from '@/config/metadata';
import { getSocialCoverImageUrl } from '@/lib/image-utils';
import { PromoPageView } from '@/components/promo/PromoPageView';
import { PromoPageModernView } from '@/components/promo/PromoPageModernView';
import { PromoPageClassicGreenView } from '@/components/promo/PromoPageClassicGreenView';

const SOCIAL_IMAGE_WIDTH = 1200;
const SOCIAL_IMAGE_HEIGHT = 630;

/**
 * Resolve a promo page + its linked book for a slug, applying the visibility
 * rules shared by the page and its metadata. Returns null when the public page
 * must behave as a standard 404 (missing slug, disabled page, or invalid book).
 */
async function resolvePromo(slug: string) {
    if (typeof slug !== 'string' || slug.length === 0) return null;

    const promoPage = await getPromoPageBySlug(slug);
    // A disabled page is indistinguishable from a missing one.
    if (!promoPage || !promoPage.isActive) return null;

    const book = await getBookById(promoPage.bookId);
    if (!book) return null;

    return { promoPage, book };
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const resolved = await resolvePromo(slug);

    if (!resolved) {
        return { title: 'Pagina non trovata', robots: { index: false, follow: false } };
    }

    const { book } = resolved;
    const description = book.extract?.trim() || book.summary?.trim()
        || `Ascolta l'anteprima audio di ${book.title}, un racconto di Piero Carbonetti.`;
    const promoUrl = new URL(`/promo/${encodeURIComponent(slug)}`, siteOrigin);
    const socialImageUrl = new URL(
        getSocialCoverImageUrl(book.coverImage, { bookId: book.id }),
        siteOrigin
    );
    const socialImageAlt = `Copertina di ${book.title}`;

    return {
        title: book.title,
        description,
        alternates: {
            canonical: promoUrl,
        },
        // Hidden marketing pages: shareable, but not indexed.
        robots: { index: false, follow: false },
        openGraph: {
            title: book.title,
            description,
            url: promoUrl,
            siteName: siteTitle,
            locale: 'it_IT',
            images: [{
                url: socialImageUrl,
                secureUrl: socialImageUrl,
                width: SOCIAL_IMAGE_WIDTH,
                height: SOCIAL_IMAGE_HEIGHT,
                type: 'image/jpeg',
                alt: socialImageAlt,
            }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: book.title,
            description,
            images: [{
                url: socialImageUrl,
                secureUrl: socialImageUrl,
                width: SOCIAL_IMAGE_WIDTH,
                height: SOCIAL_IMAGE_HEIGHT,
                type: 'image/jpeg',
                alt: socialImageAlt,
            }],
        },
    };
}

export default async function PromoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const resolved = await resolvePromo(slug);

    if (!resolved) {
        notFound();
    }

    const { promoPage, book } = resolved;

    if (promoPage.template === 'modern') {
        return <PromoPageModernView promoPage={promoPage} book={book} />;
    }

    if (promoPage.template === 'classic-green') {
        return <PromoPageClassicGreenView promoPage={promoPage} book={book} />;
    }

    return <PromoPageView promoPage={promoPage} book={book} />;
}
