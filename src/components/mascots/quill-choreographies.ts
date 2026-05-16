/**
 * Pre-built choreographies for the free-roaming Quill mascot.
 * Each choreography is an async function that chains controller actions.
 */
import type { QuillController } from './use-quill-controller';
import type { QuillEdge } from './quill-actions';

export interface EntryAndExistSideOptions {
    target?: HTMLElement | string | null;
    targetId?: string;
    entrySide?: QuillEdge;
    exitSide?: QuillEdge;
    gap?: number;
}

function normalizeTargetId(id: string): string {
    if (id.startsWith('@#')) return id.slice(2);
    if (id.startsWith('#')) return id.slice(1);
    return id;
}

function resolveTargetElement(options?: EntryAndExistSideOptions): HTMLElement | null {
    if (options?.targetId) return document.getElementById(normalizeTargetId(options.targetId));
    const target = options?.target;
    if (target instanceof HTMLElement) return target;
    if (typeof target === 'string') return document.getElementById(normalizeTargetId(target));
    return null;
}

function pickBookElement(selector = '[data-book-card]'): HTMLElement | null {
    const cards = document.querySelectorAll<HTMLElement>(selector);
    if (cards.length === 0) return null;
    return cards[Math.floor(Math.random() * cards.length)];
}

/**
 * Quill walks in, inspects a book, "touches" it (callback triggers shake),
 * nods enthusiastically, then walks away into the distance.
 */
export async function bookInspect(
    quill: QuillController,
    bookElementOrOptions?: HTMLElement | string | null | (EntryAndExistSideOptions & {
        bookSelector?: string;
        onTouch?: () => void;
    }),
    onTouch?: () => void,
): Promise<void> {
    const options: EntryAndExistSideOptions & { bookSelector?: string; onTouch?: () => void } =
        bookElementOrOptions instanceof HTMLElement || typeof bookElementOrOptions === 'string' || bookElementOrOptions == null
            ? { target: bookElementOrOptions, onTouch }
            : bookElementOrOptions;
    const bookElement = resolveTargetElement(options) ?? pickBookElement(options.bookSelector);

    if (!bookElement) {
        return peekAndLeave(quill);
    }

    const entrySide = options.entrySide ?? 'left';
    const gap = options.gap ?? 8;

    await quill.enterFrom(entrySide);
    await quill.moveToElement(bookElement, { side: entrySide, gap });
    await quill.lookAround(1500);
    (options.onTouch ?? onTouch)?.();
    await quill.nod(3);
    await quill.walkAway();
}

/**
 * Quill peeks in from the left, looks around curiously, then leaves.
 */
export async function peekAndLeave(
    quill: QuillController,
    options?: EntryAndExistSideOptions,
): Promise<void> {
    await quill.enterFrom(options?.entrySide ?? 'left');
    await quill.lookAround(2500);
    await quill.leave(options?.exitSide ?? 'right');
}

/**
 * Quill walks in, dances, then jumps off-screen.
 */
export async function wanderAndDance(
    quill: QuillController,
    options?: EntryAndExistSideOptions,
): Promise<void> {
    await quill.enterFrom(options?.entrySide ?? 'left');
    const vw = window.innerWidth;
    await quill.moveTo(vw * 0.45, window.innerHeight * 0.8);
    await quill.dance(3000);
    if (options?.exitSide) {
        await quill.leave(options.exitSide);
        return;
    }
    await quill.jumpAndEscape();
}

/**
 * Quill walks in and writes for a while, then walks out.
 */
export async function writeAndLeave(
    quill: QuillController,
    options?: EntryAndExistSideOptions,
): Promise<void> {
    const target = resolveTargetElement(options);

    if (target) {
        const entrySide = options?.entrySide ?? 'right';
        const exitSide = options?.exitSide ?? 'right';
        const gap = options?.gap ?? 12;

        await quill.enterFrom(entrySide);
        await quill.moveToElement(target, { side: entrySide, gap });
        await quill.write(4000);
        await quill.leave(exitSide);
        return;
    }

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
    targetOrOptions?: HTMLElement | string | null | EntryAndExistSideOptions,
    opts?: { gap?: number },
): Promise<void> {
    const options: EntryAndExistSideOptions =
        targetOrOptions instanceof HTMLElement || typeof targetOrOptions === 'string' || targetOrOptions == null
            ? { target: targetOrOptions, gap: opts?.gap }
            : targetOrOptions;
    const el = resolveTargetElement(options);

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
    const side: QuillEdge = options.entrySide ?? (state.x < targetCenterX ? 'left' : 'right');
    const gap = options.gap ?? 12;

    if (!state.visible) {
        await quill.enterFrom(side);
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

export interface ChoreographyOptions extends EntryAndExistSideOptions {
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
        case 'book-inspect':
            return bookInspect(quill, options);
        case 'peek-and-leave':
            return peekAndLeave(quill, options);
        case 'wander-and-dance':
            return wanderAndDance(quill, options);
        case 'write-and-leave':
            return writeAndLeave(quill, options);
        case 'walk-toward':
            return walkToward(quill, options);
    }
}
