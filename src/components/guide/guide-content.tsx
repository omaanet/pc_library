'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Headphones,
    House,
    Library,
    Menu,
    Settings,
    X,
} from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GuideFigure, type GuideMarker } from './guide-figure';

type ChapterId = 'impostazioni' | 'biblioteca' | 'scheda-racconto' | 'lettura' | 'ascolto';

interface GuideVisual {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
    markers: GuideMarker[];
}

interface GuideSection {
    title: string;
    text: string;
    visual?: GuideVisual;
}

interface GuideChapter {
    id: ChapterId;
    title: string;
    shortTitle: string;
    description: string;
    icon: LucideIcon;
    sections: GuideSection[];
}

const chapters: GuideChapter[] = [
    {
        id: 'impostazioni',
        title: 'Impostazioni',
        shortTitle: 'Impostazioni',
        description: 'Personalizza l’aspetto del sito e il modo in cui preferisci leggere.',
        icon: Settings,
        sections: [
            {
                title: 'Aspetto',
                text: 'Apri il menu del tuo profilo e scegli “Impostazioni”. Nella scheda “Aspetto” puoi scegliere il tema chiaro, scuro o quello del dispositivo e cambiare i colori dei badge dei racconti.',
                visual: {
                    src: '/guida/impostazioni-aspetto.webp',
                    alt: 'Impostazioni di aspetto con scelta del tema e della palette dei badge',
                    caption: 'Le modifiche vengono applicate subito e restano memorizzate su questo dispositivo.',
                    width: 968,
                    height: 480,
                    markers: [
                        { number: 1, text: 'Scegli “Aspetto”.' },
                        { number: 2, text: 'Seleziona il tema che trovi più comodo.' },
                        { number: 3, text: 'Scegli i colori dei badge dei racconti.' },
                    ],
                },
            },
            {
                title: 'Lettura',
                text: 'Nella scheda “Lettura” puoi decidere se vedere una o due pagine e impostare lo zoom iniziale. Le stesse scelte si possono modificare anche mentre stai leggendo.',
                visual: {
                    src: '/guida/impostazioni-lettura.webp',
                    alt: 'Impostazioni di lettura con modalità pagina e livello di zoom',
                    caption: 'Usa “Pagina singola” se vuoi caratteri più grandi o leggi da uno schermo piccolo.',
                    width: 968,
                    height: 488,
                    markers: [
                        { number: 1, text: 'Apri la scheda “Lettura”.' },
                        { number: 2, text: 'Scegli pagina singola o doppia.' },
                        { number: 3, text: 'Trascina il cursore per regolare lo zoom.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'biblioteca',
        title: 'La Biblioteca',
        shortTitle: 'Biblioteca',
        description: 'Trova un racconto e riconosci subito come puoi leggerlo o ascoltarlo.',
        icon: Library,
        sections: [
            {
                title: 'Cercare e filtrare',
                text: 'Scrivi una parte del titolo nel campo di ricerca. Attiva “solo Audio Racconti” per mostrare soltanto i racconti disponibili anche in versione audio.',
                visual: {
                    src: '/guida/biblioteca-ricerca.webp',
                    alt: 'Barra di ricerca della biblioteca e filtro per i racconti audio',
                    caption: 'La lista si aggiorna automaticamente mentre scrivi o cambi il filtro.',
                    width: 920,
                    height: 134,
                    markers: [
                        { number: 1, text: 'Scrivi qui il titolo, anche solo in parte.' },
                        { number: 2, text: 'Attiva il filtro per vedere solo i racconti audio.' },
                    ],
                },
            },
            {
                title: 'Capire una scheda',
                text: 'Ogni scheda mostra la copertina, il titolo e il pulsante da usare. Le icone sulla copertina indicano se sono disponibili lettura, audio o entrambi.',
                visual: {
                    src: '/guida/biblioteca-schede.webp',
                    alt: 'Tre schede di racconti con pulsanti e badge differenti',
                    caption: 'Premi la copertina o il pulsante per aprire la scheda completa del racconto.',
                    width: 960,
                    height: 560,
                    markers: [
                        { number: 1, text: '“NEW” indica un racconto pubblicato di recente.' },
                        { number: 2, text: 'Le icone indicano audio e lettura disponibili.' },
                        { number: 3, text: 'Il pulsante “Leggi” apre un racconto da leggere.' },
                        { number: 4, text: '“Ascolta” indica un racconto solo audio.' },
                        { number: 5, text: '“Leggi o Ascolta” offre entrambe le possibilità.' },
                    ],
                },
            },
            {
                title: 'Mostrare altri risultati',
                text: 'In fondo alla griglia il pulsante indica quanti racconti sono già visibili e quanti sono disponibili in totale. Premilo più volte finché il pulsante scompare: a quel punto sono mostrati tutti i risultati.',
                visual: {
                    src: '/guida/biblioteca-altri-risultati.webp',
                    alt: 'Pulsante per mostrare altri risultati con conteggio visibile e totale',
                    caption: 'Il conteggio, per esempio “10 di 24”, aiuta a capire quanti racconti restano da mostrare.',
                    width: 760,
                    height: 192,
                    markers: [
                        { number: 1, text: 'Premi il pulsante per aggiungere altri racconti alla griglia.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'scheda-racconto',
        title: 'La scheda del racconto',
        shortTitle: 'Scheda racconto',
        description: 'Controlla i dettagli, ingrandisci la copertina e scegli cosa fare.',
        icon: BookOpen,
        sections: [
            {
                title: 'Copertina e azioni',
                text: 'Premi la copertina per ingrandirla. “Leggi Racconto” apre il lettore. “Richiedi il PDF” invia una richiesta via e-mail: non scarica immediatamente il file.',
                visual: {
                    src: '/guida/scheda-racconto.webp',
                    alt: 'Scheda di un racconto con copertina e pulsanti principali',
                    caption: 'La scheda mostra solo le azioni disponibili per quel racconto.',
                    width: 600,
                    height: 421,
                    markers: [
                        { number: 1, text: 'Premi la copertina per vederla più grande.' },
                        { number: 2, text: 'Apri il racconto nel lettore del sito.' },
                        { number: 3, text: 'Invia una richiesta per ricevere il PDF.' },
                        { number: 4, text: 'Apre o chiude l’estratto, se presente.' },
                    ],
                },
            },
            {
                title: 'Mostrare o nascondere l’estratto',
                text: 'Premi il pulsante con la “i” per mostrare o nascondere l’estratto. Il pulsante compare soltanto quando il racconto contiene un estratto.',
                visual: {
                    src: '/guida/scheda-racconto-estratto.webp',
                    alt: 'Scheda del racconto con il pulsante informazioni e l’estratto aperto',
                    caption: 'L’estratto appare sotto la copertina e può essere richiuso in qualsiasi momento.',
                    width: 600,
                    height: 520,
                    markers: [
                        { number: 1, text: 'Mostra o nasconde l’estratto.' },
                        { number: 2, text: 'Qui viene visualizzato il testo dell’estratto.' },
                    ],
                },
            },
            {
                title: 'Copertina ingrandita',
                text: 'Per chiudere la vista ingrandita, premi la X oppure premi direttamente sull’immagine o sullo sfondo.',
                visual: {
                    src: '/guida/copertina-ingrandita.webp',
                    alt: 'Copertina ingrandita con pulsante di chiusura',
                    caption: 'La vista ingrandita non cambia il racconto: serve soltanto a osservare meglio la copertina.',
                    width: 1000,
                    height: 720,
                    markers: [
                        { number: 1, text: 'Chiude la copertina ingrandita.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'lettura',
        title: 'Leggere un racconto',
        shortTitle: 'Lettura',
        description: 'Muoviti tra le pagine, cambia la visualizzazione e conserva il punto di lettura.',
        icon: BookOpen,
        sections: [
            {
                title: 'Navigazione',
                text: 'Le frecce laterali cambiano pagina. Le frecce doppie portano direttamente all’inizio o alla fine. Il pulsante verde in alto a sinistra torna alla Biblioteca.',
                visual: {
                    src: '/guida/lettore-navigazione.webp',
                    alt: 'Lettore con pulsante per tornare alla biblioteca e frecce di navigazione',
                    caption: 'I pulsanti non disponibili scompaiono, per esempio quando sei già alla prima pagina.',
                    width: 1000,
                    height: 720,
                    markers: [
                        { number: 1, text: 'Torna alla Biblioteca.' },
                        { number: 2, text: 'Vai alla prima pagina o alla pagina precedente.' },
                        { number: 3, text: 'Vai alla pagina successiva o all’ultima pagina.' },
                    ],
                },
            },
            {
                title: 'Segnalibro, schermo intero e pagina',
                text: 'Il segnalibro conserva la posizione di lettura. Lo stesso pulsante lo rimuove quando è già attivo. Usa il pulsante accanto per entrare o uscire dallo schermo intero.',
                visual: {
                    src: '/guida/lettore-controlli.webp',
                    alt: 'Controlli del lettore per segnalibro, schermo intero e numero di pagina',
                    caption: 'Quando riapri il racconto, il lettore riparte dal segnalibro salvato.',
                    width: 1000,
                    height: 720,
                    markers: [
                        { number: 1, text: 'Aggiungi o rimuovi il segnalibro.' },
                        { number: 2, text: 'Entra o esci dallo schermo intero.' },
                        { number: 3, text: 'Premi l’indicatore per raggiungere una pagina.' },
                    ],
                },
            },
            {
                title: 'Raggiungere una pagina',
                text: 'Premi l’indicatore “Pagina” in basso. Scrivi il numero desiderato e premi “Vai”.',
                visual: {
                    src: '/guida/lettore-pagina.webp',
                    alt: 'Finestra del lettore per raggiungere un numero di pagina',
                    caption: 'Puoi inserire soltanto un numero compreso tra la prima e l’ultima pagina.',
                    width: 424,
                    height: 242,
                    markers: [
                        { number: 1, text: 'Scrivi il numero della pagina.' },
                        { number: 2, text: 'Premi “Vai” per raggiungerla.' },
                    ],
                },
            },
            {
                title: 'Opzioni di lettura',
                text: 'Premi la linguetta sul lato destro per aprire il pannello. Puoi richiuderlo con la stessa linguetta oppure premendo fuori dal pannello.',
                visual: {
                    src: '/guida/lettore-opzioni.webp',
                    alt: 'Pannello delle opzioni di lettura con visualizzazione e zoom',
                    caption: 'Le preferenze restano memorizzate anche per i racconti successivi.',
                    width: 1000,
                    height: 720,
                    markers: [
                        { number: 1, text: 'Apri o chiudi le opzioni.' },
                        { number: 2, text: 'Scegli una pagina oppure due pagine affiancate.' },
                        { number: 3, text: 'Riduci, ripristina o aumenta lo zoom.' },
                        { number: 4, text: 'Premi fuori dal pannello per chiuderlo.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'ascolto',
        title: 'Ascoltare un racconto',
        shortTitle: 'Ascolto',
        description: 'Usa il lettore audio e conserva il punto in cui hai interrotto.',
        icon: Headphones,
        sections: [
            {
                title: 'Comandi del lettore audio',
                text: 'Il lettore mostra il titolo della traccia, il tempo trascorso e la durata. Puoi spostarti nel racconto con la barra, cambiare traccia e mettere in pausa.',
                visual: {
                    src: '/guida/lettore-audio.webp',
                    alt: 'Lettore audio con avanzamento, riproduzione, numero della traccia e segnalibro',
                    caption: 'Se il racconto contiene più tracce, compaiono anche i pulsanti precedente e successiva.',
                    width: 764,
                    height: 180,
                    markers: [
                        { number: 1, text: 'Titolo della traccia in ascolto.' },
                        { number: 2, text: 'Tempo trascorso e durata totale.' },
                        { number: 3, text: 'Trascina la barra per cambiare punto.' },
                        { number: 4, text: 'Usa le frecce e il pulsante centrale per cambiare traccia, riprodurre o mettere in pausa.' },
                        { number: 5, text: 'Indica la traccia corrente e il numero totale.' },
                        { number: 6, text: 'Aggiungi o rimuovi il segnalibro audio.' },
                    ],
                },
            },
            {
                title: 'Volume',
                text: 'Premi l’icona del volume per silenziare l’audio o aprire il comando verticale. Trascina il cursore verso l’alto o verso il basso per regolare il livello.',
                visual: {
                    src: '/guida/lettore-audio-volume.webp',
                    alt: 'Lettore audio con regolazione verticale del volume aperta',
                    caption: 'La percentuale sopra il cursore indica il volume impostato.',
                    width: 771,
                    height: 245,
                    markers: [
                        { number: 1, text: 'Apre il volume o silenzia l’audio.' },
                        { number: 2, text: 'Regola il volume con il cursore verticale.' },
                    ],
                },
            },
        ],
    },
];

function isChapterId(value: string): value is ChapterId {
    return chapters.some((chapter) => chapter.id === value);
}

export function GuideContent() {
    const [activeId, setActiveId] = useState<ChapterId>('impostazioni');
    const [mobileIndexOpen, setMobileIndexOpen] = useState(false);

    useEffect(() => {
        const syncFromHash = () => {
            const hash = window.location.hash.slice(1);
            setActiveId(isChapterId(hash) ? hash : 'impostazioni');
        };

        syncFromHash();
        window.addEventListener('hashchange', syncFromHash);
        window.addEventListener('popstate', syncFromHash);
        return () => {
            window.removeEventListener('hashchange', syncFromHash);
            window.removeEventListener('popstate', syncFromHash);
        };
    }, []);

    const activeIndex = chapters.findIndex((chapter) => chapter.id === activeId);
    const activeChapter = chapters[activeIndex] ?? chapters[0];

    const selectChapter = useCallback((id: ChapterId) => {
        if (window.location.hash !== `#${id}`) {
            window.history.pushState(null, '', `#${id}`);
        }
        setActiveId(id);
        setMobileIndexOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const chapterNavigation = useMemo(() => (
        <nav aria-label="Capitoli della guida" className="space-y-2">
            {chapters.map((chapter, index) => {
                const Icon = chapter.icon;
                const active = chapter.id === activeId;
                return (
                    <button
                        key={chapter.id}
                        type="button"
                        onClick={() => selectChapter(chapter.id)}
                        className={cn(
                            'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-base transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                            active
                                ? 'bg-sky-700 font-semibold text-white shadow-sm'
                                : 'text-foreground hover:bg-muted'
                        )}
                        aria-current={active ? 'page' : undefined}
                    >
                        <span className={cn(
                            'flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold',
                            active ? 'bg-white/20' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                        )}>
                            {index + 1}
                        </span>
                        <Icon className="h-5 w-5 flex-none" aria-hidden="true" />
                        <span>{chapter.shortTitle}</span>
                    </button>
                );
            })}
        </nav>
    ), [activeId, selectChapter]);

    return (
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
            <div className="mb-7 border-b pb-6 sm:mb-10">
                <Link
                    href="/"
                    className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg border bg-card px-4 py-2 text-base font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                    <House className="h-5 w-5" aria-hidden="true" />
                    Torna alla Biblioteca
                </Link>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                    Guida all’uso
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Come usare il sito
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-muted-foreground">
                    Scegli un argomento dall’indice. Ogni spiegazione è breve e accompagnata da un’immagine.
                </p>
            </div>

            <div className="mb-6 lg:hidden">
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-12 w-full justify-between text-base"
                    onClick={() => setMobileIndexOpen((open) => !open)}
                    aria-expanded={mobileIndexOpen}
                    aria-controls="mobile-guide-index"
                >
                    <span className="flex items-center gap-2">
                        <Menu className="h-5 w-5" aria-hidden="true" />
                        Indice: {activeChapter.shortTitle}
                    </span>
                    {mobileIndexOpen ? (
                        <X className="h-5 w-5" aria-hidden="true" />
                    ) : (
                        <ChevronDown className="h-5 w-5" aria-hidden="true" />
                    )}
                </Button>
                {mobileIndexOpen && (
                    <div id="mobile-guide-index" className="mt-3 rounded-2xl border bg-card p-3 shadow-sm">
                        {chapterNavigation}
                    </div>
                )}
            </div>

            <div className="grid gap-10 lg:grid-cols-[270px_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                    <div className="sticky top-24 rounded-2xl border bg-card p-4 shadow-sm">
                        <h2 className="mb-3 px-2 text-lg font-semibold">Indice</h2>
                        {chapterNavigation}
                    </div>
                </aside>

                <article key={activeChapter.id} className="min-w-0 animate-in fade-in-0 duration-300">
                    <header className="mb-8">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                            <activeChapter.icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">{activeChapter.title}</h2>
                        <p className="mt-3 text-lg leading-8 text-muted-foreground">
                            {activeChapter.description}
                        </p>
                    </header>

                    <div className="space-y-12">
                        {activeChapter.sections.map((section) => (
                            <section key={section.title} className="space-y-5">
                                <div className="max-w-4xl">
                                    <h3 className="text-2xl font-semibold tracking-tight">{section.title}</h3>
                                    <p className="mt-3 text-lg leading-8 text-muted-foreground">{section.text}</p>
                                </div>
                                {section.visual && <GuideFigure {...section.visual} />}
                            </section>
                        ))}
                    </div>

                    <div className="mt-12 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-12 text-base"
                            disabled={activeIndex <= 0}
                            onClick={() => selectChapter(chapters[activeIndex - 1].id)}
                        >
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            Capitolo precedente
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-12 text-base"
                            disabled={activeIndex >= chapters.length - 1}
                            onClick={() => selectChapter(chapters[activeIndex + 1].id)}
                        >
                            Capitolo successivo
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    </div>
                </article>
            </div>
        </main>
    );
}
