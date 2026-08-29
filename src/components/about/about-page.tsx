'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    ArrowDown,
    ArrowRight,
    BookOpenText,
    CalendarDays,
    Feather,
    HeartHandshake,
    MapPinned,
    Music2,
    Sparkles,
    UtensilsCrossed,
} from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';
import { BookDialogSimple } from '@/components/books/book-dialog';
import { RootNav } from '@/components/layout/root-nav';
import { SiteFooter } from '@/components/shared/site-footer';
import { displayFontClass } from '@/config/fonts';
import { useAuth } from '@/context/auth-context';
import { isBookAvailable } from '@/lib/book-visibility';
import type { Book, BookResponse } from '@/types';

const LINKED_BOOKS = {
    'Suor Turchese': {
        libraryTitle: 'Suor Turchese',
    },
    'Il volo di Ecru': {
        libraryTitle: 'Il volo di Ecru',
    },
    'Il segreto dell’ottico': {
        libraryTitle: "Il segreto dell'Ottico",
    },
    'La maison du plaisir': {
        libraryTitle: 'La Maison du Plaisir (Romanzo di Ricette)',
    },
} as const;

type LinkedBookTitle = keyof typeof LINKED_BOOKS;

const linkedBookEntries = Object.entries(LINKED_BOOKS) as Array<[
    LinkedBookTitle,
    (typeof LINKED_BOOKS)[LinkedBookTitle],
]>;

const SUOR_TURCHESE_TITLE: LinkedBookTitle = 'Suor Turchese';

const pageSections = [
    { href: '#autore', label: 'L’autore', number: '01' },
    { href: '#pubblicazioni', label: 'Le pubblicazioni', number: '02' },
    { href: '#il-progetto', label: 'Il progetto', number: '03' },
    { href: '#territorio', label: 'Sul territorio', number: '04' },
] as const;

const publications = [
    {
        title: 'Il volo di Ecru',
        label: 'L’ultimo libro',
        icon: Music2,
        color: 'sky',
        text: (
            <>
                L’opera ha aggiunto una forte dimensione narrativa e artistica ad un importante evento benefico del territorio. È stata presentata nel maggio 2026 a Busto Garolfo, durante una serata musicale con il soprano <strong className="font-semibold text-foreground">Lucia Rubedo</strong>, accompagnata dal maestro <strong className="font-semibold text-foreground">Alberto Brachini</strong>.
            </>
        ),
    },
    {
        title: 'Il segreto dell’ottico',
        label: 'Settembre 2024',
        icon: Sparkles,
        color: 'amber',
        text: (
            <>
                Il libro ha accompagnato la prima edizione di Trombusto, il grande raduno nazionale di trombettisti dedicato alla memoria di <strong className="font-semibold text-foreground">Ezio Pinciroli</strong>. La manifestazione, diretta dal maestro <strong className="font-semibold text-foreground">Francesco Marsigliese</strong>, ha avuto come ospite d’eccezione <strong className="font-semibold text-foreground">Fabrizio Bosso</strong>, tra i più influenti e celebrati trombettisti jazz al mondo.
            </>
        ),
    },
    {
        title: 'La maison du plaisir',
        subtitle: 'Il giro del mondo in 76 ricette',
        label: '2020',
        icon: UtensilsCrossed,
        color: 'emerald',
        text: (
            <>
                Pubblicato nel 2020, il libro è stato scritto da <strong className="font-semibold text-foreground">Carbonetti</strong> a quattro mani con lo chef internazionale <strong className="font-semibold text-foreground">Roberto Raimondi</strong>. Definito dagli stessi autori un “romanzo di ricette”, il volume intreccia arte culinaria e narrazione ed è nato con l’obiettivo di sostenere i progetti di due ONLUS milanesi.
            </>
        ),
    },
] as const;

const publicationStyles = {
    sky: {
        icon: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
        line: 'bg-sky-400',
        titleLink: 'decoration-sky-400 hover:text-sky-700 focus-visible:ring-sky-500 dark:hover:text-sky-300',
    },
    amber: {
        icon: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        line: 'bg-amber-400',
        titleLink: 'decoration-amber-400 hover:text-amber-700 focus-visible:ring-amber-500 dark:hover:text-amber-300',
    },
    emerald: {
        icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        line: 'bg-emerald-400',
        titleLink: 'decoration-emerald-400 hover:text-emerald-700 focus-visible:ring-emerald-500 dark:hover:text-emerald-300',
    },
} as const;

export function AboutPage() {
    const {
        state: { isAuthenticated },
    } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const linkedBookCacheRef = useRef<Partial<Record<LinkedBookTitle, Book>>>({});
    const [availableBookTitles, setAvailableBookTitles] = useState<Set<LinkedBookTitle>>(() => new Set());
    const [selectedLinkedBook, setSelectedLinkedBook] = useState<Book | null>(null);
    const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const resolveAvailableBooks = async () => {
            const params = new URLSearchParams({
                displayPreviews: '-1',
                perPage: '-1',
                isVisible: '1',
            });
            const response = await fetch(`/api/books?${params.toString()}`, {
                cache: 'no-store',
                signal: controller.signal,
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json() as BookResponse;
            const availableTitles = new Set<LinkedBookTitle>();

            for (const [displayTitle, lookup] of linkedBookEntries) {
                const matchingBook = data.books.find(
                    (book) => book.title.trim().localeCompare(lookup.libraryTitle, 'it', { sensitivity: 'base' }) === 0
                );

                if (matchingBook && isBookAvailable(matchingBook)) {
                    linkedBookCacheRef.current[displayTitle] = matchingBook;
                    availableTitles.add(displayTitle);
                }
            }

            setAvailableBookTitles(availableTitles);
        };

        void resolveAvailableBooks().catch((error: unknown) => {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                setAvailableBookTitles(new Set());
            }
        });

        return () => controller.abort();
    }, []);

    const openLibraryBook = (title: LinkedBookTitle) => {
        const book = linkedBookCacheRef.current[title];
        if (!book || !availableBookTitles.has(title)) return;

        setSelectedLinkedBook(book);
        setIsBookDialogOpen(true);
    };

    return (
        <>
            <RootNav
                isAuthenticated={isAuthenticated}
                onAuthClick={() => setIsAuthModalOpen(true)}
            />

            <main className="flex-1 overflow-hidden">
                <section className="relative isolate border-b">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-36 top-20 -z-20 h-96 w-96 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-950/35"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-28 top-0 -z-20 h-[30rem] w-[30rem] rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-950/25"
                    />
                    <div className="mx-auto grid min-h-[calc(100vh-6.75rem)] w-full max-w-7xl items-center gap-12 px-5 py-16 sm:min-h-[calc(100vh-4rem)] sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:py-24">
                        <div className="max-w-3xl animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-background/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm backdrop-blur dark:border-sky-900 dark:text-sky-300">
                                <Feather className="h-3.5 w-3.5" aria-hidden="true" />
                                Chi siamo
                            </div>
                            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                                <strong className="font-semibold">Piero Carbonetti</strong>
                                <span className={`mt-3 block text-4xl font-semibold leading-tight text-sky-600 sm:text-5xl lg:text-6xl dark:text-sky-400 ${displayFontClass}`}>
                                    e Racconti in Voce e Caratteri
                                </span>
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                                La storia di un autore per passione e di un progetto indipendente in cui fantasia, voce e solidarietà si incontrano.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="#autore"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-900/15 transition-transform hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:bg-sky-600 dark:hover:bg-sky-500"
                                >
                                    Conosci la storia
                                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/#collection"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border bg-background/75 px-6 py-3 font-semibold shadow-sm backdrop-blur transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                >
                                    Esplora i racconti
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>

                        <div className="relative mx-auto hidden w-full max-w-lg lg:block" aria-hidden="true">
                            <div className="about-float-slow relative aspect-square rounded-[3.5rem] border border-sky-200/80 bg-background/65 p-10 shadow-[0_35px_90px_-45px_rgba(2,132,199,0.55)] backdrop-blur dark:border-sky-900/80">
                                <div className="absolute inset-10 rounded-full border border-dashed border-sky-300/80 dark:border-sky-800" />
                                <div className="absolute inset-[28%] rounded-full bg-gradient-to-br from-sky-100 via-background to-amber-100 shadow-inner dark:from-sky-950 dark:via-background dark:to-amber-950" />
                                <svg viewBox="0 0 240 240" className="absolute inset-[24%] h-[52%] w-[52%]" fill="none">
                                    <path
                                        d="M58 174C73 135 102 87 177 48C145 76 125 105 112 136C101 160 83 176 58 174Z"
                                        stroke="var(--text-quill)"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M58 174C87 146 117 117 160 72"
                                        stroke="var(--gold-main)"
                                        strokeWidth="7"
                                        strokeLinecap="round"
                                    />
                                    <path d="M74 184C88 174 99 198 114 185C127 174 139 195 154 183" stroke="#0ea5e9" strokeWidth="6" strokeLinecap="round" />
                                    <path d="M154 150C176 150 185 139 197 127" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" opacity=".75" />
                                    <path d="M159 165C186 165 199 151 211 137" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" opacity=".4" />
                                </svg>
                                <div className="about-orbit-one absolute left-3 top-[18%] rounded-full border bg-background px-4 py-2 text-sm font-semibold text-sky-700 shadow-md dark:text-sky-300">voce</div>
                                <div className="about-orbit-two absolute right-0 top-[34%] rounded-full border bg-background px-4 py-2 text-sm font-semibold text-amber-700 shadow-md dark:text-amber-300">caratteri</div>
                                <div className="about-orbit-three absolute bottom-[13%] left-[18%] rounded-full border bg-background px-4 py-2 text-sm font-semibold text-emerald-700 shadow-md dark:text-emerald-300">solidarietà</div>
                            </div>
                        </div>
                    </div>

                    <nav aria-label="Indice della pagina" className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8 lg:px-12">
                        <div className="grid overflow-hidden rounded-2xl border bg-background/85 shadow-sm backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
                            {pageSections.map((section) => (
                                <Link
                                    key={section.href}
                                    href={section.href}
                                    className="group flex min-h-16 items-center gap-3 border-b px-5 py-3 transition-colors hover:bg-sky-50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(n+3)]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:[&:nth-child(odd)]:border-r dark:hover:bg-sky-950/40"
                                >
                                    <span className="text-xs font-bold tracking-widest text-sky-600 dark:text-sky-400">{section.number}</span>
                                    <span className="font-semibold">{section.label}</span>
                                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                </Link>
                            ))}
                        </div>
                    </nav>
                </section>

                <section id="autore" className="scroll-mt-32 px-5 py-20 sm:scroll-mt-24 sm:px-8 sm:py-28 lg:px-12">
                    <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
                        <header>
                            <p className="text-sm font-bold tracking-[0.2em] text-sky-600 dark:text-sky-400">01 — L’AUTORE</p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Scrivere per passione, raccontare per tutti.
                            </h2>
                        </header>
                        <div className="space-y-6 text-lg leading-8 text-muted-foreground">
                            <p>
                                <strong className="font-semibold text-foreground">Piero Carbonetti</strong> coltiva da sempre la passione per la scrittura.
                                Ha affiancato questa passione a un’intensa vita lavorativa, dando vita a racconti leggeri e appassionanti.
                            </p>
                            <p>
                                La sua narrativa si distingue per uno stile accessibile, capace di alternare racconti radicati nel realismo popolare a storie ambientate in mondi onirici e fantastici.
                            </p>
                            <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-sky-50/70 p-7 text-foreground dark:border-sky-900 dark:bg-sky-950/30 sm:p-9">
                                <BookOpenText className="mb-5 h-8 w-8 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                                <p className="text-xl font-light leading-8">
                                    Tra le sue opere più conosciute troviamo{' '}
                                    {availableBookTitles.has(SUOR_TURCHESE_TITLE) ? (
                                        <button
                                            type="button"
                                            onClick={() => openLibraryBook(SUOR_TURCHESE_TITLE)}
                                            aria-haspopup="dialog"
                                            className="inline-flex items-baseline rounded-sm font-semibold text-sky-700 underline decoration-sky-400 decoration-2 underline-offset-4 transition-colors hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-300 dark:hover:text-sky-100"
                                        >
                                            <cite className="not-italic">{SUOR_TURCHESE_TITLE}</cite>
                                        </button>
                                    ) : (
                                        <cite className="font-semibold not-italic">{SUOR_TURCHESE_TITLE}</cite>
                                    )}
                                    , il libro d’esordio, accolto con particolare interesse dal pubblico e dalla critica locale.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="pubblicazioni" className="scroll-mt-32 border-y bg-muted/35 px-5 py-20 sm:scroll-mt-24 sm:px-8 sm:py-28 lg:px-12">
                    <div className="mx-auto w-full max-w-7xl">
                        <header className="max-w-3xl">
                            <p className="text-sm font-bold tracking-[0.2em] text-amber-600 dark:text-amber-400">02 — LE PUBBLICAZIONI</p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Libri che incontrano musica, cucina e solidarietà.</h2>
                            <p className="mt-5 text-lg leading-8 text-muted-foreground">
                                Le pubblicazioni più recenti raccontano un percorso creativo legato anche alle iniziative del territorio.
                            </p>
                        </header>

                        <div className="mt-12 grid gap-5 lg:grid-cols-3">
                            {publications.map((publication) => {
                                const Icon = publication.icon;
                                const styles = publicationStyles[publication.color];
                                return (
                                    <article key={publication.title} className="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:p-8">
                                        <span className={`absolute inset-x-0 top-0 h-1 ${styles.line}`} />
                                        <div className="flex items-start justify-between gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}>
                                                <Icon className="h-6 w-6" aria-hidden="true" />
                                            </div>
                                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{publication.label}</span>
                                        </div>
                                        <h3 className="mt-7 text-2xl font-semibold tracking-tight">
                                            {availableBookTitles.has(publication.title) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => openLibraryBook(publication.title)}
                                                    aria-haspopup="dialog"
                                                    className={`inline-flex rounded-sm text-left underline decoration-2 underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styles.titleLink}`}
                                                >
                                                    {publication.title}
                                                </button>
                                            ) : (
                                                publication.title
                                            )}
                                        </h3>
                                        {'subtitle' in publication && publication.subtitle && (
                                            <p className="mt-1 text-muted-foreground">{publication.subtitle}</p>
                                        )}
                                        <p className="mt-5 leading-7 text-muted-foreground">{publication.text}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="il-progetto" className="relative isolate scroll-mt-32 px-5 py-20 sm:scroll-mt-24 sm:px-8 sm:py-28 lg:px-12">
                    <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-950/25" />
                    <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
                        <div>
                            <p className="text-sm font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400">03 — IL PROGETTO</p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Un progetto digitale, libero e solidale.
                            </h2>
                            <div className="mt-7 space-y-5 text-lg leading-8 text-muted-foreground">
                                <p>
                                    <strong className="font-semibold text-foreground">Racconti in Voce e Caratteri</strong> è la piattaforma web indipendente creata da <strong className="font-semibold text-foreground">Piero Carbonetti</strong> per raccogliere e pubblicare gratuitamente storie e racconti di fantasia.
                                </p>
                                <p>
                                    L’accesso ai testi è libero. Ai lettori viene rivolto un semplice invito morale: ricambiare il piacere della lettura con un gesto spontaneo di beneficenza a favore di enti, organizzazioni o persone in difficoltà.
                                </p>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-8 shadow-[0_30px_80px_-50px_rgba(5,150,105,0.7)] dark:border-emerald-900 dark:bg-emerald-950/25 sm:p-10">
                            <HeartHandshake className="h-11 w-11 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                            <p className="mt-7 text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10">
                                Le storie sono gratuite. L’invito è trasformare la lettura in un gesto libero di solidarietà.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-2">
                                <span className="rounded-full border border-emerald-200 bg-background/80 px-4 py-2 text-sm font-semibold dark:border-emerald-900">Accesso libero</span>
                                <span className="rounded-full border border-emerald-200 bg-background/80 px-4 py-2 text-sm font-semibold dark:border-emerald-900">Donazione spontanea</span>
                                <span className="rounded-full border border-emerald-200 bg-background/80 px-4 py-2 text-sm font-semibold dark:border-emerald-900">Scelta del lettore</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="territorio" className="scroll-mt-32 bg-slate-950 px-5 py-20 text-white sm:scroll-mt-24 sm:px-8 sm:py-28 lg:px-12 dark:bg-black">
                    <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                        <header>
                            <p className="text-sm font-bold tracking-[0.2em] text-sky-300">04 — SUL TERRITORIO</p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">La scrittura come occasione d’incontro.</h2>
                            <p className="mt-5 text-lg leading-8 text-slate-300">
                                Il progetto ha preso parte a due iniziative dedicate agli autori locali.
                            </p>
                        </header>

                        <div className="space-y-5">
                            <article className="grid gap-5 rounded-3xl border border-white/15 bg-white/[0.06] p-6 sm:grid-cols-[7rem_1fr] sm:p-8">
                                <div>
                                    <CalendarDays className="h-6 w-6 text-sky-300" aria-hidden="true" />
                                    <p className="mt-3 text-3xl font-semibold">2024</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">“Autori Kilometro Zero”</h3>
                                    <p className="mt-3 leading-7 text-slate-300">Iniziativa organizzata dalla biblioteca di Busto Garolfo.</p>
                                </div>
                            </article>
                            <article className="grid gap-5 rounded-3xl border border-white/15 bg-white/[0.06] p-6 sm:grid-cols-[7rem_1fr] sm:p-8">
                                <div>
                                    <MapPinned className="h-6 w-6 text-amber-300" aria-hidden="true" />
                                    <p className="mt-3 text-3xl font-semibold">2025</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">“CAPitolo”</h3>
                                    <p className="mt-3 leading-7 text-slate-300">Giornata dedicata agli autori del territorio, ospitata dalla biblioteca di Legnano (MI).</p>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="px-5 py-20 text-center sm:px-8 sm:py-24">
                    <div className="mx-auto max-w-3xl">
                        <Feather className="mx-auto h-9 w-9 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                        <h2 className={`mt-5 text-4xl font-semibold text-sky-600 sm:text-5xl dark:text-sky-400 ${displayFontClass}`}>
                            Ora lascia parlare le storie.
                        </h2>
                        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                            Scopri la raccolta e scegli il prossimo racconto da leggere o ascoltare.
                        </p>
                        <Link
                            href="/#collection"
                            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                        >
                            Vai alla Biblioteca
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>
            </main>

            <SiteFooter emphasizeNames />

            <BookDialogSimple
                book={selectedLinkedBook}
                open={isBookDialogOpen}
                onOpenChange={setIsBookDialogOpen}
                isAuthenticated={isAuthenticated}
                onLoginClick={() => setIsAuthModalOpen(true)}
            />
            <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
        </>
    );
}
