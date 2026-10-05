# Generi dei libri

## Migrazione prima del rilascio

Eseguire `scripts/migrations/20261005_add_book_genres.sql` sul database di ogni
ambiente **prima di distribuire il codice**: le query dei libri leggono la nuova
colonna `genres`. La migrazione in produzione viene eseguita dall'utente;
l'implementazione e i test non eseguono richieste al database di produzione.

Il file SQL può essere eseguito dall'editor SQL del database oppure con `psql`
passando la connessione del database desiderato e l'opzione `ON_ERROR_STOP=1`:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/migrations/20261005_add_book_genres.sql
```

La migrazione è transazionale e idempotente. Aggiunge `genres TEXT[] NOT NULL`,
imposta il default a `['Racconti']` e assegna questo genere ai libri esistenti.
Una seconda esecuzione conserva i generi già salvati. Il vincolo consente uno
o entrambi i generi `Racconti` e `Racconti per bambini`, senza duplicati, elementi
nulli o altri valori.

## Compatibilità e verifica

`POST /api/books` usa `Racconti` quando `genres` è omesso.
`PUT /api/books/[id]` conserva i generi esistenti quando il campo è omesso.
Un campo presente deve essere un array non vuoto di generi ammessi, senza
duplicati; altrimenti l'API risponde con stato 400 prima di modificare il libro.
Le risposte di lettura, creazione e aggiornamento includono `genres`.

Dopo la migrazione, verificare il default sui libri esistenti, il salvataggio
di entrambi i generi e la loro conservazione riaprendo o clonando un libro.
Un eventuale ritorno alla versione precedente dell'applicazione può lasciare
la colonna nel database: non è necessario eliminarla.
