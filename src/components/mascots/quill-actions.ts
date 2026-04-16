/**
 * Animation primitives for the free-roaming Quill mascot.
 * Each action is an async function that manipulates sprite state over time
 * using requestAnimationFrame for smooth interpolation.
 */

export type QuillPose = 'idle' | 'walking' | 'looking' | 'nodding' | 'dancing' | 'writing';
export type QuillFacing = 'left' | 'right';
export type QuillEdge = 'left' | 'right' | 'bottom';

export interface QuillState {
    x: number;
    y: number;
    scale: number;
    opacity: number;
    pose: QuillPose;
    facing: QuillFacing;
    visible: boolean;
}

export const INITIAL_STATE: QuillState = {
    x: -100,
    y: 0,
    scale: 1,
    opacity: 1,
    pose: 'idle',
    facing: 'right',
    visible: false,
};

type StateUpdater = (patch: Partial<QuillState>) => void;

/** Lerp helper */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Responsive base speed — shorter distances on smaller screens */
function getBaseSpeed(): number {
    if (typeof window === 'undefined') return 200;
    return Math.max(120, Math.min(250, window.innerWidth * 0.15));
}

/** Wait ms, cancellable */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}

/** Animate from current position to target using rAF */
function animatePosition(
    update: StateUpdater,
    getState: () => QuillState,
    targetX: number,
    targetY: number,
    speed: number,
    signal?: AbortSignal,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const startX = getState().x;
        const startY = getState().y;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = (distance / speed) * 1000;

        if (duration < 16) {
            update({ x: targetX, y: targetY });
            resolve();
            return;
        }

        const startTime = performance.now();
        let rafId: number;

        const onAbort = () => {
            cancelAnimationFrame(rafId);
            reject(new DOMException('Aborted', 'AbortError'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });

        function tick(now: number) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad

            update({
                x: lerp(startX, targetX, eased),
                y: lerp(startY, targetY, eased),
            });

            if (t < 1) {
                rafId = requestAnimationFrame(tick);
            } else {
                signal?.removeEventListener('abort', onAbort);
                resolve();
            }
        }

        rafId = requestAnimationFrame(tick);
    });
}

/** Animate scale + opacity (for walkAway shrink/fade) */
function animateScaleOpacity(
    update: StateUpdater,
    getState: () => QuillState,
    targetScale: number,
    targetOpacity: number,
    durationMs: number,
    signal?: AbortSignal,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const startScale = getState().scale;
        const startOpacity = getState().opacity;
        const startTime = performance.now();
        let rafId: number;

        const onAbort = () => {
            cancelAnimationFrame(rafId);
            reject(new DOMException('Aborted', 'AbortError'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });

        function tick(now: number) {
            const t = Math.min((now - startTime) / durationMs, 1);
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

            update({
                scale: lerp(startScale, targetScale, eased),
                opacity: lerp(startOpacity, targetOpacity, eased),
            });

            if (t < 1) {
                rafId = requestAnimationFrame(tick);
            } else {
                signal?.removeEventListener('abort', onAbort);
                resolve();
            }
        }

        rafId = requestAnimationFrame(tick);
    });
}

// ─── Public action creators ─────────────────────────────────────────────

export interface ActionContext {
    update: StateUpdater;
    getState: () => QuillState;
    signal: AbortSignal;
}

export async function enterFrom(
    ctx: ActionContext,
    edge: QuillEdge,
): Promise<void> {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const groundY = vh * 0.85;

    let startX: number;
    let startY: number;
    let targetX: number;
    const targetY = groundY;

    switch (edge) {
        case 'left':
            startX = -80;
            startY = groundY;
            targetX = vw * 0.1;
            ctx.update({ facing: 'right' });
            break;
        case 'right':
            startX = vw + 80;
            startY = groundY;
            targetX = vw * 0.9;
            ctx.update({ facing: 'left' });
            break;
        case 'bottom':
            startX = vw * 0.5;
            startY = vh + 80;
            targetX = vw * 0.5;
            ctx.update({ facing: 'right' });
            break;
    }

    ctx.update({ x: startX, y: startY, visible: true, opacity: 1, scale: 1, pose: 'walking' });
    await animatePosition(ctx.update, ctx.getState, targetX, targetY, getBaseSpeed(), ctx.signal);
    ctx.update({ pose: 'idle' });
}

export async function moveTo(
    ctx: ActionContext,
    targetX: number,
    targetY: number,
    speed?: number,
): Promise<void> {
    const state = ctx.getState();
    const newFacing: QuillFacing = targetX > state.x ? 'right' : 'left';
    ctx.update({ pose: 'walking', facing: newFacing });
    await animatePosition(ctx.update, ctx.getState, targetX, targetY, speed ?? getBaseSpeed(), ctx.signal);
    ctx.update({ pose: 'idle' });
}

export async function moveToElement(
    ctx: ActionContext,
    el: HTMLElement,
    offset?: { side?: 'left' | 'right'; gap?: number },
): Promise<void> {
    const rect = el.getBoundingClientRect();
    const side = offset?.side ?? 'left';
    const gap = offset?.gap ?? 10;
    const spriteWidth = getSpriteWidth();

    let targetX: number;
    if (side === 'left') {
        targetX = rect.left - spriteWidth - gap;
    } else {
        targetX = rect.right + gap;
    }
    const targetY = rect.top + rect.height * 0.5;

    const newFacing: QuillFacing = side === 'left' ? 'right' : 'left';
    ctx.update({ pose: 'walking', facing: newFacing });
    await animatePosition(ctx.update, ctx.getState, targetX, targetY, getBaseSpeed(), ctx.signal);
    ctx.update({ pose: 'idle' });
}

export async function lookAround(ctx: ActionContext, durationMs = 3000): Promise<void> {
    ctx.update({ pose: 'looking' });
    await wait(durationMs, ctx.signal);
    ctx.update({ pose: 'idle' });
}

export async function nod(ctx: ActionContext, count = 3): Promise<void> {
    ctx.update({ pose: 'nodding' });
    await wait(count * 400, ctx.signal);
    ctx.update({ pose: 'idle' });
}

export async function dance(ctx: ActionContext, durationMs = 3000): Promise<void> {
    ctx.update({ pose: 'dancing' });
    await wait(durationMs, ctx.signal);
    ctx.update({ pose: 'idle' });
}

export async function write(ctx: ActionContext, durationMs = 4000): Promise<void> {
    ctx.update({ pose: 'writing' });
    await wait(durationMs, ctx.signal);
    ctx.update({ pose: 'idle' });
}

export async function jumpAndEscape(ctx: ActionContext): Promise<void> {
    const vw = window.innerWidth;
    const state = ctx.getState();

    // Jump up
    ctx.update({ pose: 'idle' });
    await animatePosition(ctx.update, ctx.getState, state.x, state.y - 60, 300, ctx.signal);

    // Zoom off to the right
    ctx.update({ facing: 'right', pose: 'idle' });
    const targetX = vw + 100;
    await Promise.all([
        animatePosition(ctx.update, ctx.getState, targetX, ctx.getState().y - 20, 500, ctx.signal),
        animateScaleOpacity(ctx.update, ctx.getState, 0.5, 0, 1000, ctx.signal),
    ]);

    ctx.update({ visible: false });
}

export async function walkAway(ctx: ActionContext): Promise<void> {
    const state = ctx.getState();
    // Turn around (face away — we show the back by flipping direction)
    const awayFacing: QuillFacing = state.facing === 'right' ? 'left' : 'right';
    ctx.update({ facing: awayFacing, pose: 'walking' });

    // Walk "into the distance" — move up while shrinking and fading
    const targetY = state.y - 120;
    await Promise.all([
        animatePosition(ctx.update, ctx.getState, state.x, targetY, 60, ctx.signal),
        animateScaleOpacity(ctx.update, ctx.getState, 0.2, 0, 2500, ctx.signal),
    ]);

    ctx.update({ visible: false, pose: 'idle' });
}

export async function leave(ctx: ActionContext, edge: QuillEdge = 'right'): Promise<void> {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const state = ctx.getState();

    let targetX = state.x;
    let targetY = state.y;

    switch (edge) {
        case 'left':
            targetX = -100;
            ctx.update({ facing: 'left' });
            break;
        case 'right':
            targetX = vw + 100;
            ctx.update({ facing: 'right' });
            break;
        case 'bottom':
            targetY = vh + 100;
            break;
    }

    ctx.update({ pose: 'walking' });
    await animatePosition(ctx.update, ctx.getState, targetX, targetY, getBaseSpeed(), ctx.signal);
    ctx.update({ visible: false, pose: 'idle' });
}

export function hide(ctx: ActionContext): void {
    ctx.update({ visible: false });
}

/** Get responsive sprite width */
function getSpriteWidth(): number {
    if (typeof window === 'undefined') return 60;
    // clamp(40, 8vw, 70)
    return Math.max(40, Math.min(70, window.innerWidth * 0.08));
}

export { getSpriteWidth };
