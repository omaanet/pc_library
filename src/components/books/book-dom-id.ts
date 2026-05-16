export function formatBookDomId(id: string | number): string {
    const idText = String(id);
    const numericId = idText.startsWith('book-') ? idText.slice('book-'.length) : idText;

    return `book-${numericId.padStart(3, '0')}`;
}
