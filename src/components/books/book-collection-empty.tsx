/**
 * Empty state component displayed when no books match the current filters.
 * 
 * @example
 * ```tsx
 * {books.length === 0 && <BookCollectionEmpty />}
 * ```
 */
export function BookCollectionEmpty() {
    return (
        <div className="text-center py-8 text-muted-foreground">
            Nessun libro trovato.<br/>Prova a modificare la ricerca o i filtri.
        </div>
    );
}
