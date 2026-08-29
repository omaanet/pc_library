import type { Metadata } from 'next';
import Link from 'next/link';
import { BookAccessLegalNote } from '@/components/legal/book-access-legal-note';
import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { SITE_CONFIG } from '@/config/site-config';

export const metadata: Metadata = {
    title: 'Privacy',
    description: 'Informativa sul trattamento dei dati personali di Racconti in Voce e Caratteri.',
};

const contactEmail = SITE_CONFIG.PRIVACY_EMAIL;

export default function PrivacyPage() {
    return (
        <LegalPageShell>
            <article className="space-y-10 text-[15px] leading-7 text-muted-foreground sm:text-base">
                <header className="space-y-3 border-b pb-7">
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
                        Informativa ai sensi dell’art. 13 del GDPR
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Informativa sulla privacy
                    </h1>
                    <p>Ultimo aggiornamento: 28 agosto 2026</p>
                </header>

                <section className="rounded-xl border border-sky-200 bg-sky-50/70 p-5 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                    <h2 className="text-lg font-semibold">In breve</h2>
                    <p className="mt-2">
                        Questo sito non vende dati personali, non mostra pubblicità comportamentale e non crea profili
                        commerciali. Tratta soltanto i dati necessari per offrire le funzioni richieste, proteggere il
                        servizio e ottenere statistiche tecniche e aggregate sul suo utilizzo.
                    </p>
                    <div className="mt-3 border-t border-sky-200 pt-3 dark:border-sky-900">
                        <BookAccessLegalNote context="privacy" />
                    </div>
                </section>

                <PolicySection title="1. Titolare del trattamento">
                    <p>
                        Il titolare del trattamento è <strong className="text-foreground">Piero Carbonetti</strong>,
                        responsabile del sito “Racconti in Voce e Caratteri”. Per domande o per esercitare i diritti
                        indicati in questa informativa è possibile scrivere a{' '}
                        <a className="text-sky-700 underline underline-offset-4 dark:text-sky-300" href={`mailto:${contactEmail}`}>
                            {contactEmail}
                        </a>.
                    </p>
                </PolicySection>

                <PolicySection title="2. Quali dati vengono trattati">
                    <ul className="list-disc space-y-3 pl-6 marker:text-sky-500">
                        <li>
                            <strong className="text-foreground">Dati dell’account:</strong> nome e cognome, indirizzo
                            email, identificativo interno, data di creazione e livello di accesso. La registrazione e
                            l’accesso sono senza password.
                        </li>
                        <li>
                            <strong className="text-foreground">Dati forniti dall’utente:</strong> commenti e risposte,
                            preferenze di lettura, segnalibri e posizione raggiunta nel testo o nell’audio. Il nome e il
                            contenuto dei commenti sono visibili agli altri visitatori del libro interessato.
                        </li>
                        <li>
                            <strong className="text-foreground">Richieste e comunicazioni:</strong> quando si richiede un
                            PDF, il messaggio inviato al gestore include nome, email, identificativo dell’account, libro
                            richiesto e data della richiesta. Le email inviate direttamente al recapito del sito sono
                            trattate per rispondere al mittente.
                        </li>
                        <li>
                            <strong className="text-foreground">Dati tecnici e di utilizzo:</strong> indirizzo IP,
                            percorso richiesto, data e ora, esito dell’operazione, identificativo utente se autenticato e
                            informazioni essenziali sull’attività (per esempio apertura, ascolto o download di un libro).
                            I log servono al funzionamento, alla sicurezza, alla diagnosi degli errori e alla produzione
                            di statistiche interne.
                        </li>
                        <li>
                            <strong className="text-foreground">Pagine promozionali:</strong> per i visitatori non
                            autenticati l’indirizzo IP viene trasformato tramite HMAC in un codice non direttamente
                            leggibile; possono essere registrati anche user agent, pagina di provenienza e conteggi di
                            apertura o ascolto. Per gli utenti autenticati le stesse attività possono essere associate
                            all’identificativo e al nome dell’account.
                        </li>
                        <li>
                            <strong className="text-foreground">Statistiche aggregate:</strong> Vercel Web Analytics
                            rileva visualizzazioni di pagina e informazioni generali come percorso, provenienza,
                            area geografica approssimativa, browser, sistema operativo e tipo di dispositivo. Il servizio
                            è configurato senza cookie di terze parti e non associa le statistiche a un indirizzo IP o a
                            un’identità personale.
                        </li>
                    </ul>
                </PolicySection>

                <PolicySection title="3. Finalità e basi giuridiche">
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                            <thead className="bg-muted/60 text-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Finalità</th>
                                    <th className="px-4 py-3 font-semibold">Base giuridica</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="px-4 py-3">Creare e gestire l’account e fornire lettura, ascolto, download, commenti, segnalibri e preferenze.</td>
                                    <td className="px-4 py-3">Esecuzione del servizio richiesto dall’utente (art. 6, par. 1, lett. b GDPR).</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Rispondere a richieste e comunicazioni.</td>
                                    <td className="px-4 py-3">Esecuzione di misure richieste dall’interessato e legittimo interesse a gestire le comunicazioni.</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Proteggere il sito, prevenire abusi e diagnosticare errori.</td>
                                    <td className="px-4 py-3">Legittimo interesse del titolare alla sicurezza e continuità del servizio (art. 6, par. 1, lett. f GDPR).</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Produrre statistiche essenziali e aggregate per comprendere il funzionamento e l’uso dei contenuti.</td>
                                    <td className="px-4 py-3">Legittimo interesse al miglioramento del servizio, con minimizzazione e aggregazione dei dati.</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Adempiere a obblighi di legge o richieste delle autorità.</td>
                                    <td className="px-4 py-3">Obbligo legale (art. 6, par. 1, lett. c GDPR).</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p>
                        Non vengono svolte attività di marketing, profilazione o decisione automatizzata e non viene
                        chiesto il consenso per tali finalità.
                    </p>
                </PolicySection>

                <PolicySection title="4. Conferimento dei dati">
                    <BookAccessLegalNote context="privacy" />
                    <p>
                        Nome ed email sono necessari quando l’utente decide di registrarsi; senza questi dati non è
                        possibile creare l’account né fornire le funzioni che lo richiedono. Commenti, segnalibri,
                        preferenze e richieste di PDF sono facoltativi e vengono trattati solo quando l’utente decide di
                        usare il relativo servizio.
                    </p>
                </PolicySection>

                <PolicySection title="5. Destinatari e fornitori tecnici">
                    <p>
                        I dati non sono venduti, ceduti o comunicati per finalità pubblicitarie. Possono essere trattati,
                        nei limiti necessari, da fornitori di hosting e analisi tecnica (Vercel), database (Neon),
                        archiviazione e distribuzione dei contenuti multimediali (Wasabi) e posta elettronica (fornitore
                        SMTP configurato dal sito), oltre che da persone autorizzate alla gestione del servizio. I dati
                        possono inoltre essere comunicati quando richiesto dalla legge o da un’autorità competente.
                    </p>
                </PolicySection>

                <PolicySection title="6. Trasferimenti fuori dallo Spazio economico europeo">
                    <p>
                        Alcuni fornitori tecnici possono trattare dati anche in Paesi esterni allo Spazio economico
                        europeo. In tali casi il trasferimento avviene, secondo il servizio utilizzato e ove necessario,
                        sulla base di una decisione di adeguatezza, delle clausole contrattuali standard approvate dalla
                        Commissione europea o di un’altra garanzia prevista dagli artt. 44 e seguenti del GDPR.
                    </p>
                </PolicySection>

                <PolicySection title="7. Tempi di conservazione">
                    <ul className="list-disc space-y-3 pl-6 marker:text-sky-500">
                        <li>I dati dell’account e le preferenze collegate sono conservati per la durata dell’account e cancellati quando non sono più necessari, salvo obblighi di legge o necessità di tutela di un diritto.</li>
                        <li>Commenti e risposte restano pubblicati finché il contenuto o l’account non vengono rimossi; una richiesta di cancellazione sarà valutata anche rispetto alla continuità delle conversazioni.</li>
                        <li>Richieste e corrispondenza sono conservate per il tempo necessario a gestirle e a documentare l’attività svolta.</li>
                        <li>Log tecnici e dati di utilizzo sono conservati per il tempo proporzionato alle esigenze di sicurezza, assistenza e statistica; successivamente vengono cancellati o aggregati quando l’identificazione non è più necessaria.</li>
                        <li>I dati salvati soltanto nel browser restano fino alla loro cancellazione da parte dell’utente o del browser. I dettagli sono nella <Link className="text-sky-700 underline underline-offset-4 dark:text-sky-300" href="/cookies">Cookie policy</Link>.</li>
                    </ul>
                </PolicySection>

                <PolicySection title="8. Sicurezza">
                    <p>
                        Il sito adotta misure tecniche e organizzative proporzionate, tra cui connessioni cifrate in
                        produzione, cookie di sessione HttpOnly, SameSite e Secure, controlli di accesso, protezione CSRF,
                        query parametrizzate e limitazione degli accessi amministrativi. Nessuna trasmissione o sistema
                        informatico può tuttavia essere garantito come privo di rischi in assoluto.
                    </p>
                </PolicySection>

                <PolicySection title="9. Diritti dell’interessato">
                    <p>
                        Nei casi previsti dal GDPR è possibile chiedere accesso, rettifica, cancellazione, limitazione del
                        trattamento, portabilità dei dati e opposizione ai trattamenti fondati sul legittimo interesse.
                        Le richieste possono essere inviate a{' '}
                        <a className="text-sky-700 underline underline-offset-4 dark:text-sky-300" href={`mailto:${contactEmail}`}>
                            {contactEmail}
                        </a>. È inoltre possibile proporre reclamo al{' '}
                        <a
                            className="text-sky-700 underline underline-offset-4 dark:text-sky-300"
                            href="https://www.garanteprivacy.it/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Garante per la protezione dei dati personali
                        </a>{' '}
                        o rivolgersi all’autorità di controllo competente del proprio Paese.
                    </p>
                </PolicySection>

                <PolicySection title="10. Modifiche all’informativa">
                    <p>
                        Questa informativa può essere aggiornata quando cambiano le funzioni del sito, i fornitori o la
                        normativa applicabile. La data riportata in apertura indica la versione più recente.
                    </p>
                </PolicySection>
            </article>
        </LegalPageShell>
    );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
            {children}
        </section>
    );
}
