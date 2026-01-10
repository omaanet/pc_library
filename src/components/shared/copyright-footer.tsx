import React, { memo } from 'react';
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
}

const DICTIONARY = {
    it: {
        rights: 'Tutti i diritti riservati.',
    },
    en: {
        rights: 'All rights reserved.',
    },
} as const;

export const CopyrightFooter: React.FC<CopyrightFooterProps> = memo(({ lang = 'it', detailed = false }) => {
    const { AUTHOR, SITE_NAME, SITE_URL, ESTABLISHED_YEAR } = SITE_CONFIG.METADATA;
    const currentYear = new Date().getFullYear();
    const yearDisplay = currentYear === ESTABLISHED_YEAR 
        ? `${ESTABLISHED_YEAR}` 
        : `${ESTABLISHED_YEAR} - ${currentYear}`;

    const rightsText = DICTIONARY[lang].rights;

    return (
        <>
            &copy; {yearDisplay} {' '}
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
            {detailed && ` - ${AUTHOR}`}
            {' '} - {rightsText}
        </>
    );
});

CopyrightFooter.displayName = 'CopyrightFooter';
