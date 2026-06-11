import type { Metadata } from 'next';

export const siteTitle = 'Racconti in Voce e Caratteri';

export const siteDescription = `
<p>Per scelta personale i contenuti di questo sito web sono gratuiti; a tutte le persone che si collegheranno chiedo solo un semplice gesto di solidarietà: un impegno morale di una libera donazione di beneficenza a chi si vuole, un atto di sostegno nei confronti di enti o persone bisognose di aiuto. Grazie di cuore</p>
<p class="signature">Piero Carbonetti</p>
<blockquote>
    <p>&quot;La solidarietà è l'unico investimento che non fallisce mai.&quot;</p>
    <cite>H.D. Thoreau</cite>
</blockquote>
`.trim();
export const siteDescriptionText = 'Per scelta personale i contenuti di questo sito web sono gratuiti; a tutte le persone che si collegheranno chiedo solo un semplice gesto di solidarietà: un impegno morale di una libera donazione di beneficenza a chi si vuole, un atto di sostegno nei confronti di enti o persone bisognose di aiuto. Grazie di cuore Piero Carbonetti. "La solidarietà è l\'unico investimento che non fallisce mai." H.D. Thoreau';
export const siteSubtitle = 'Espressioni di Scrittura Creativa';
export const siteIntro = 'Una variegata raccolta narrativa di fantasia dell’autore Piero Carbonetti';
export const siteContributionText = {
    callToAction: 'Un libero contributo da destinarsi a scelta del lettore a favore di:',
    beneficiaries: 'Organizzazioni Non Profit, Associazioni di Volontariato, Fondazioni o a cause specifiche.',
} as const;

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'),
    title: {
        default: siteTitle,
        template: `%s | ${siteTitle}`,
    },
    description: siteDescriptionText,
    keywords: ['racconti', 'audioracconti'],
    authors: [{ name: 'Piero Carbonetti' }],
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [
            { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    manifest: '/manifest.json',
};
