/**
 * Animation primitives for the free-roaming Quill mascot.
 * Each action is an async function that manipulates sprite state over time
 * using requestAnimationFrame for smooth interpolation.
 */

export type QuillPose =
    | 'idle'
    | 'walking'
    | 'running'
    | 'looking'
    | 'nodding'
    | 'dancing'
    | 'writing'
    | 'jumping'
    | 'climbing';
export type QuillFacing = 'left' | 'right';
export type QuillEdge = 'left' | 'right' | 'top' | 'bottom';

/** Easing function names supported by movement actions */
export type Easing = 'linear' | 'easeInOut' | 'easeOutQuad' | 'easeOutBack';

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

/** Resolve a normalized t in [0,1] under the named easing curve. */
function applyEasing(t: number, easing: Easing): number {
    switch (easing) {
        case 'linear':
            return t;
        case 'easeInOut':
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        case 'easeOutQuad':
            return 1 - (1 - t) * (1 - t);
        case 'easeOutBack': {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
    }
}

/** Responsive base speed — shorter distances on smaller screens */
function getBaseSpeed(): number {
    if (typeof window === 'undefined') return 200;
    return Math.max(120, Math.min(250, window.innerWidth * 0.15));
}

/** Speed multiplier applied to the running pose */
const RUN_SPEED_MULTIPLIER = 2.2;

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
    easing: Easing = 'easeInOut',
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
            const eased = applyEasing(t, easing);

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

    let startX = 0;
    let startY = groundY;
    let targetX = vw * 0.5;
    let targetY = groundY;

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
        case 'top':
            startX = vw * 0.5;
            startY = -80;
            targetX = vw * 0.5;
            targetY = groundY;
            ctx.update({ facing: 'right' });
            break;
        case 'bottom':
            startX = vw * 0.5;
            startY = vh + 80;
            targetX = vw * 0.5;
            ctx.update({ facing: 'right' });
            break;
    }

    // Top/bottom entries read as climbing in 2D screen space (vertical
    // ascent/descent), not lateral walking; ground edges keep the walk gait.
    const travelPose: QuillPose = edge === 'top' || edge === 'bottom' ? 'climbing' : 'walking';
    const travelSpeed = travelPose === 'climbing' ? getBaseSpeed() * 0.65 : getBaseSpeed();
    ctx.update({ x: startX, y: startY, visible: true, opacity: 1, scale: 1, pose: travelPose });
    await animatePosition(ctx.update, ctx.getState, targetX, targetY, travelSpeed, ctx.signal);
    ctx.update({ pose: 'idle' });
}

export interface MoveOptions {
    /** Pixels-per-second; defaults to a responsive base speed */
    speed?: number;
    /** Easing curve applied to the position lerp */
    easing?: Easing;
    /** Whether to update facing toward the movement direction (default: true) */
    faceMovement?: boolean;
    /** Override the pose held during travel (default: 'walking') */
    pose?: QuillPose;
}

export async function moveTo(
    ctx: ActionContext,
    targetX: number,
    targetY: number,
    speedOrOptions?: number | MoveOptions,
): Promise<void> {
    const opts: MoveOptions =
        typeof speedOrOptions === 'number'
            ? { speed: speedOrOptions }
            : speedOrOptions ?? {};

    const state = ctx.getState();
    const faceMovement = opts.faceMovement ?? true;
    const pose = opts.pose ?? 'walking';
    const patch: Partial<QuillState> = { pose };
    if (faceMovement) {
        patch.facing = targetX > state.x ? 'right' : 'left';
    }
    ctx.update(patch);
    await animatePosition(
        ctx.update,
        ctx.getState,
        targetX,
        targetY,
        opts.speed ?? getBaseSpeed(),
        ctx.signal,
        opts.easing,
    );
    ctx.update({ pose: 'idle' });
}

/**
 * Run to a target position — same shape as moveTo but uses the 'running'
 * pose, a faster base speed, and an easeOutQuad ramp so the mascot
 * accelerates quickly and decelerates into the destination.
 */
export async function run(
    ctx: ActionContext,
    targetX: number,
    targetY: number,
    opts: MoveOptions = {},
): Promise<void> {
    const state = ctx.getState();
    const faceMovement = opts.faceMovement ?? true;
    const patch: Partial<QuillState> = { pose: 'running' };
    if (faceMovement) {
        patch.facing = targetX > state.x ? 'right' : 'left';
    }
    ctx.update(patch);
    await animatePosition(
        ctx.update,
        ctx.getState,
        targetX,
        targetY,
        opts.speed ?? getBaseSpeed() * RUN_SPEED_MULTIPLIER,
        ctx.signal,
        opts.easing ?? 'easeOutQuad',
    );
    ctx.update({ pose: 'idle' });
}

/**
 * Walk a multi-waypoint path. The mascot re-faces and re-poses for each
 * segment, so calling `walkPath([{x,y}, {x,y}, ...])` reads as a
 * single smooth journey rather than discrete teleports.
 */
export async function walkPath(
    ctx: ActionContext,
    points: { x: number; y: number }[],
    opts: MoveOptions = {},
): Promise<void> {
    if (points.length === 0) return;
    const pose = opts.pose ?? 'walking';
    const speed =
        opts.speed ?? (pose === 'running' ? getBaseSpeed() * RUN_SPEED_MULTIPLIER : getBaseSpeed());
    const faceMovement = opts.faceMovement ?? true;
    for (const p of points) {
        const current = ctx.getState();
        const patch: Partial<QuillState> = { pose };
        if (faceMovement) {
            patch.facing = p.x > current.x ? 'right' : 'left';
        }
        ctx.update(patch);
        await animatePosition(
            ctx.update,
            ctx.getState,
            p.x,
            p.y,
            speed,
            ctx.signal,
            opts.easing ?? 'easeInOut',
        );
    }
    ctx.update({ pose: 'idle' });
}

/**
 * Turn in place to a target facing. Holds the idle pose and waits
 * briefly so the visual "step" reads naturally instead of snapping.
 */
export async function turnTo(
    ctx: ActionContext,
    facing: QuillFacing,
): Promise<void> {
    const state = ctx.getState();
    if (state.facing === facing) return;
    ctx.update({ pose: 'idle', facing });
    await wait(160, ctx.signal);
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
    const state = ctx.getState();

    // Anticipate + leap up using the jumping pose
    ctx.update({ pose: 'jumping' });
    await animatePosition(
        ctx.update,
        ctx.getState,
        state.x,
        state.y - 80,
        320,
        ctx.signal,
        'easeOutQuad',
    );

    // Escape "into the screen" — keep climbing along the z-axis while
    // shrinking and fading, instead of leaving sideways.
    ctx.update({ pose: 'climbing' });
    const apexX = ctx.getState().x;
    const apexY = ctx.getState().y;
    await Promise.all([
        animatePosition(
            ctx.update,
            ctx.getState,
            apexX,
            apexY - 160,
            220,
            ctx.signal,
            'easeInOut',
        ),
        animateScaleOpacity(ctx.update, ctx.getState, 0.3, 0, 900, ctx.signal),
    ]);

    ctx.update({ visible: false, pose: 'idle' });
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
        case 'top':
            targetY = -100;
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
