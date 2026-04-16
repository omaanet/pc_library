/**
 * Pre-built choreographies for the free-roaming Quill mascot.
 * Each choreography is an async function that chains controller actions.
 */
import type { QuillController } from './use-quill-controller';

/**
 * Quill walks in, inspects a book, "touches" it (callback triggers shake),
 * nods enthusiastically, then walks away into the distance.
 */
export async function bookInspect(
    quill: QuillController,
    bookElement: HTMLElement,
    onTouch?: () => void,
): Promise<void> {
    await quill.enterFrom('left');
    await quill.moveToElement(bookElement, { side: 'left', gap: 8 });
    await quill.lookAround(1500);
    onTouch?.();
    await quill.nod(3);
    await quill.walkAway();
}

/**
 * Quill peeks in from the left, looks around curiously, then leaves.
 */
export async function peekAndLeave(quill: QuillController): Promise<void> {
    await quill.enterFrom('left');
    await quill.lookAround(2500);
    await quill.leave('right');
}

/**
 * Quill walks in, dances, then jumps off-screen.
 */
export async function wanderAndDance(quill: QuillController): Promise<void> {
    await quill.enterFrom('left');
    const vw = window.innerWidth;
    await quill.moveTo(vw * 0.45, window.innerHeight * 0.8);
    await quill.dance(3000);
    await quill.jumpAndEscape();
}

/**
 * Quill walks in and writes for a while, then walks out.
 */
export async function writeAndLeave(quill: QuillController): Promise<void> {
    await quill.enterFrom('right');
    const vw = window.innerWidth;
    await quill.moveTo(vw * 0.5, window.innerHeight * 0.85);
    await quill.write(4000);
    await quill.leave('right');
}

/** Registry of named choreographies for declarative usage */
export type ChoreographyName =
    | 'book-inspect'
    | 'peek-and-leave'
    | 'wander-and-dance'
    | 'write-and-leave';

export interface ChoreographyOptions {
    /** CSS selector to find a target element (for book-inspect) */
    bookSelector?: string;
    /** Callback when Quill "touches" an element */
    onTouch?: () => void;
}

/**
 * Run a named choreography. Returns a promise that resolves when done.
 */
export async function runChoreography(
    name: ChoreographyName,
    quill: QuillController,
    options?: ChoreographyOptions,
): Promise<void> {
    switch (name) {
        case 'book-inspect': {
            const selector = options?.bookSelector ?? '[data-book-card]';
            const cards = document.querySelectorAll<HTMLElement>(selector);
            if (cards.length === 0) {
                // Fallback to peek-and-leave if no books found
                return peekAndLeave(quill);
            }
            const randomCard = cards[Math.floor(Math.random() * cards.length)];
            return bookInspect(quill, randomCard, options?.onTouch);
        }
        case 'peek-and-leave':
            return peekAndLeave(quill);
        case 'wander-and-dance':
            return wanderAndDance(quill);
        case 'write-and-leave':
            return writeAndLeave(quill);
    }
}
