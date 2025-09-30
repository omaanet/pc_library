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

export const CopyrightFooter: React.FC<CopyrightFooterProps> = ({ lang = 'it', detailed = false }) => {
    const year = new Date().getFullYear();

    if (detailed) {
        return (
            <>
                &copy; {year} <a href="https://www.omaa.it" target="_blank" rel="noopener noreferrer">OMAA.net</a> - Oscar e Paolo Mucchiati - {lang === 'it' ? 'Tutti i diritti riservati.' : 'All rights reserved.'}
            </>
        );
    }

    return (
        <>
            &copy; {year} OMAA.net - {lang === 'it' ? 'Tutti i diritti riservati.' : 'All rights reserved.'}
        </>
    );
};
