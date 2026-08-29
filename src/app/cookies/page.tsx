import type { Metadata } from 'next';
import Link from 'next/link';
import { BookAccessLegalNote } from '@/components/legal/book-access-legal-note';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
    title: 'Cookie',
    description: 'Informativa sui cookie e sugli strumenti di memorizzazione locale del sito.',
};

export default function CookiesPage() {
    return (
        <LegalPageShell>
            <article className="space-y-10 text-[15px] leading-7 text-muted-foreground sm:text-base">
                <header className="space-y-3 border-b pb-7">
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
                        Cookie e altri strumenti tecnici
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Cookie policy
                    </h1>
                    <p>Ultimo aggiornamento: 28 agosto 2026</p>
                </header>

                <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                    <h2 className="text-lg font-semibold">In breve</h2>
                    <p className="mt-2">
                        Il sito non utilizza cookie pubblicitari o di profilazione. L’unico cookie impostato
                        dall’applicazione è tecnico e serve a mantenere l’accesso dell’utente. Preferenze e segnalibri
                        anonimi possono essere memorizzati localmente nel browser per fornire le funzioni richieste.
                    </p>
                    <div className="mt-3 border-t border-emerald-200 pt-3 dark:border-emerald-900">
                        <BookAccessLegalNote context="cookies" />
                    </div>
                </section>

                <CookieSection title="1. Che cosa sono cookie e memorie locali">
                    <p>
                        I cookie sono piccoli file di testo salvati dal browser e restituiti al sito nelle richieste
                        successive. Il browser offre anche <em>localStorage</em> e <em>sessionStorage</em>: non sono cookie,
                        ma permettono al sito di ricordare impostazioni sul dispositivo. In questa informativa sono
                        descritti insieme per maggiore trasparenza.
                    </p>
                </CookieSection>

                <CookieSection title="2. Cookie utilizzato">
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                            <thead className="bg-muted/60 text-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Nome</th>
                                    <th className="px-4 py-3 font-semibold">Tipo e durata</th>
                                    <th className="px-4 py-3 font-semibold">Funzione</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t">
                                    <td className="px-4 py-3 font-mono text-xs text-foreground">session</td>
                                    <td className="px-4 py-3">Prima parte, tecnico; massimo 3 ore. Viene cancellato anche al logout.</td>
                                    <td className="px-4 py-3">Mantiene l’utente autenticato e consente l’accesso sicuro alle funzioni riservate. È impostato solo dopo registrazione o accesso ed è HttpOnly, SameSite=Strict e, in produzione, Secure.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p>
                        Il cookie è strettamente necessario al servizio richiesto e non è usato per pubblicità,
                        profilazione o tracciamento tra siti diversi.
                    </p>
                </CookieSection>

                <CookieSection title="3. Memorizzazione tecnica nel browser">
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                            <thead className="bg-muted/60 text-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Dati</th>
                                    <th className="px-4 py-3 font-semibold">Memoria e durata</th>
                                    <th className="px-4 py-3 font-semibold">Funzione</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="px-4 py-3">Filtri e ricerca della biblioteca</td>
                                    <td className="px-4 py-3"><em>localStorage</em>, fino alla cancellazione dal browser</td>
                                    <td className="px-4 py-3">Ripristina le scelte dell’utente nelle visite successive.</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Segnalibri anonimi e stile del lettore</td>
                                    <td className="px-4 py-3"><em>localStorage</em>, fino alla cancellazione o al ripristino delle impostazioni</td>
                                    <td className="px-4 py-3">Ricorda pagina, posizione audio e aspetto scelto senza creare un account.</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Stato di ritorno alla biblioteca</td>
                                    <td className="px-4 py-3"><em>sessionStorage</em>, per la sessione della scheda</td>
                                    <td className="px-4 py-3">Riporta l’utente al libro e ai filtri precedenti.</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Indicatori di animazione e apertura del lettore</td>
                                    <td className="px-4 py-3"><em>sessionStorage</em>, per la sessione della scheda</td>
                                    <td className="px-4 py-3">Evita di ripetere animazioni o lo stesso evento tecnico nella medesima sessione.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CookieSection>

                <CookieSection title="4. Statistiche senza cookie">
                    <p>
                        Il sito usa Vercel Web Analytics per statistiche aggregate sulle visualizzazioni. Secondo la
                        configurazione rilevata, il servizio non installa cookie di terze parti e non conserva l’indirizzo
                        IP associato alle visualizzazioni; una sessione tecnica basata su un identificatore derivato dalla
                        richiesta viene eliminata dopo 24 ore. Possono essere elaborati percorso visitato, provenienza,
                        area geografica approssimativa e caratteristiche generali di browser e dispositivo.
                    </p>
                    <p>
                        Il sito produce inoltre conteggi interni relativi ad aperture, ascolti e download. Questi dati non
                        sono salvati come cookie nel dispositivo. Per categorie, finalità e basi giuridiche consulta
                        l’<Link className="text-sky-700 underline underline-offset-4 dark:text-sky-300" href="/privacy">informativa sulla privacy</Link>.
                    </p>
                </CookieSection>

                <CookieSection title="5. Perché non compare un banner di consenso">
                    <p>
                        Gli strumenti memorizzati nel browser sono limitati alle funzioni tecniche richieste dall’utente;
                        non risultano cookie pubblicitari, di profilazione o social. Per questo non viene richiesto un
                        consenso preventivo, fermo restando l’obbligo di fornire questa informativa. Se in futuro saranno
                        introdotti strumenti non necessari, verranno bloccati fino alla scelta dell’utente e questa pagina
                        sarà aggiornata.
                    </p>
                </CookieSection>

                <CookieSection title="6. Come cancellare o bloccare i dati locali">
                    <p>
                        È possibile cancellare cookie e dati dei siti dalle impostazioni del browser. Il blocco del cookie{' '}
                        <span className="font-mono text-xs text-foreground">session</span>{' '}impedisce di mantenere
                        l’accesso; la cancellazione delle memorie locali elimina filtri, segnalibri anonimi e altre
                        preferenze salvate su quel dispositivo. Le istruzioni dipendono dal browser utilizzato.
                    </p>
                </CookieSection>

                <CookieSection title="7. Aggiornamenti">
                    <p>
                        La presente informativa viene aggiornata se cambiano gli strumenti utilizzati dal sito. La data in
                        apertura identifica la versione corrente. Per domande sul trattamento dei dati o per esercitare i
                        propri diritti si può usare il contatto indicato nell’<Link className="text-sky-700 underline underline-offset-4 dark:text-sky-300" href="/privacy">informativa sulla privacy</Link>.
                    </p>
                </CookieSection>
            </article>
        </LegalPageShell>
    );
}

function CookieSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
            {children}
        </section>
    );
}
