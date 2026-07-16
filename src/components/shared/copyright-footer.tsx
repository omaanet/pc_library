import { SITE_CONFIG } from '@/config/site-config';

interface CopyrightFooterProps {
    /**
     * Language: 'it' (Italian) or 'en' (English)
     * Default: 'it'
     */
    lang?: 'it' | 'en';
    /**
     * Whether to show detailed author info and link (for home page)
     */
    detailed?: boolean;
    /**
     * Whether to emphasize the named people in the copyright line
     */
    emphasizeNames?: boolean;
}

const DICTIONARY = {
    it: {
        rights: 'Tutti i diritti riservati.',
        siteCreditPrefix: 'Sito web ideato e sviluppato da',
    },
    en: {
        rights: 'All rights reserved.',
        siteCreditPrefix: 'Website designed and developed by',
    },
} as const;

export function CopyrightFooter({ lang = 'it', detailed = false, emphasizeNames = false }: CopyrightFooterProps) {
    const { COPYRIGHT_HOLDER, SITE_NAME, SITE_URL, SITE_CREATORS, ESTABLISHED_YEAR } = SITE_CONFIG.METADATA;
    const currentYear = new Date().getFullYear();
    const yearDisplay = currentYear === ESTABLISHED_YEAR
        ? `${ESTABLISHED_YEAR}`
        : `${ESTABLISHED_YEAR} - ${currentYear}`;

    const { rights, siteCreditPrefix } = DICTIONARY[lang];

    return (
        <>
            &copy; {yearDisplay}{' '}
            {emphasizeNames ? <strong className="font-semibold text-foreground">{COPYRIGHT_HOLDER}</strong> : COPYRIGHT_HOLDER}. {rights}{' '}
            {siteCreditPrefix}{' '}
            {detailed ? (
                <a
                    href={SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                >
                    {SITE_NAME}
                </a>
            ) : (
                SITE_NAME
            )}
            {' '} - {emphasizeNames ? <strong className="font-semibold text-foreground">{SITE_CREATORS}</strong> : SITE_CREATORS}.
        </>
    );
}
