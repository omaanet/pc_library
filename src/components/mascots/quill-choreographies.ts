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

/**
 * Quill walks toward a target element (resolved by HTMLElement or DOM id).
 * When no target is provided, walks toward the center of the viewport.
 * The mascot stops near the target's bounding box with a small clearance
 * so it never overlaps the element. If the mascot is offscreen it first
 * enters from the side closest to the target.
 */
export async function walkToward(
    quill: QuillController,
    target?: HTMLElement | string | null,
    opts?: { gap?: number },
): Promise<void> {
    const el =
        typeof target === 'string'
            ? document.getElementById(target)
            : target ?? null;

    // No target → walk to the center of the viewport.
    if (!el) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const state = quill.getState();
        if (!state.visible) {
            await quill.enterFrom('left');
        }
        await quill.moveTo(vw * 0.5, vh * 0.6);
        return;
    }

    const rect = el.getBoundingClientRect();
    const targetCenterX = rect.left + rect.width * 0.5;
    const state = quill.getState();
    // Approach from whichever side the mascot is currently on so it
    // walks toward the target rather than crossing over it.
    const side: 'left' | 'right' = state.x < targetCenterX ? 'left' : 'right';
    const gap = opts?.gap ?? 12;

    if (!state.visible) {
        await quill.enterFrom(side === 'left' ? 'left' : 'right');
    }
    await quill.moveToElement(el, { side, gap });
    await quill.lookAround(900);
}

/** Registry of named choreographies for declarative usage */
export type ChoreographyName =
    | 'book-inspect'
    | 'peek-and-leave'
    | 'wander-and-dance'
    | 'write-and-leave'
    | 'walk-toward';

export interface ChoreographyOptions {
    /** CSS selector to find a target element (for book-inspect) */
    bookSelector?: string;
    /** DOM element id to target (for walk-toward) */
    targetId?: string;
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
        case 'walk-toward': {
            const el = options?.targetId
                ? document.getElementById(options.targetId)
                : null;
            return walkToward(quill, el);
        }
    }
}
