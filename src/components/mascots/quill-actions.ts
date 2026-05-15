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

/**
 * Time-based variant of animatePosition. Lerps from current position to
 * the target over `durationMs`, ignoring speed. Used by stepped/climbing
 * sequences where each rung of the motion must take a fixed time so the
 * leg-cycle CSS animation stays in sync.
 */
function animatePositionTimed(
    update: StateUpdater,
    getState: () => QuillState,
    targetX: number,
    targetY: number,
    durationMs: number,
    signal?: AbortSignal,
    easing: Easing = 'easeInOut',
): Promise<void> {
    return new Promise((resolve, reject) => {
        const startX = getState().x;
        const startY = getState().y;

        if (durationMs < 16) {
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
            const t = Math.min((now - startTime) / durationMs, 1);
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

/**
 * Animate position in discrete rungs. Each rung moves a fixed fraction of
 * the total delta over `stepMs` with a short settle pause between rungs,
 * reading as climbing/stepping rather than a continuous slide. The
 * CSS-driven leg cycle keeps swinging underneath, so feet appear to plant
 * on each rung.
 */
async function animateStepped(
    ctx: ActionContext,
    targetX: number,
    targetY: number,
    steps: number,
    stepMs: number,
    settleMs: number,
    easing: Easing = 'easeOutQuad',
): Promise<void> {
    const startX = ctx.getState().x;
    const startY = ctx.getState().y;
    for (let i = 1; i <= steps; i++) {
        const tx = startX + (targetX - startX) * (i / steps);
        const ty = startY + (targetY - startY) * (i / steps);
        await animatePositionTimed(ctx.update, ctx.getState, tx, ty, stepMs, ctx.signal, easing);
        if (settleMs > 0 && i < steps) {
            await wait(settleMs, ctx.signal);
        }
    }
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

    if (edge === 'top' || edge === 'bottom') {
        // Climb into view one rung at a time. The CSS leg cycle alternates
        // back/front legs on each step, so the discrete vertical hops read
        // as foot-then-foot-then-body climbing rather than a slide.
        ctx.update({ x: startX, y: startY, visible: true, opacity: 1, scale: 1, pose: 'climbing' });
        // Step duration matches half the climbing leg cycle (~0.35s) so one
        // leg plants per rung. Six rungs gives a clearly stepped descent/ascent.
        await animateStepped(ctx, targetX, targetY, 6, 320, 60, 'easeOutQuad');
        ctx.update({ pose: 'idle' });
        return;
    }

    ctx.update({ x: startX, y: startY, visible: true, opacity: 1, scale: 1, pose: 'walking' });
    await animatePosition(ctx.update, ctx.getState, targetX, targetY, getBaseSpeed(), ctx.signal);
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
    await wait(count * 550, ctx.signal);
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

/**
 * One continuous escape sequence:
 *   1. anticipation crouch (scale-Y squish via state.scale dip)
 *   2. upward leap to an invisible ledge
 *   3. mid-air latch — brief hold + small dip as if catching the edge
 *   4. slip through an invisible hole — pull-through bob
 *   5. stepped retreat upward (climbing rhythm) while crouching, shrinking
 *      and fading into the distance
 * No abrupt pose teleports: each phase shares position with the next.
 */
export async function jumpAndEscape(ctx: ActionContext): Promise<void> {
    const start = ctx.getState();

    // 1) Anticipation — quick crouch (scale dips, position drops a touch)
    ctx.update({ pose: 'jumping' });
    await animatePositionTimed(ctx.update, ctx.getState, start.x, start.y + 4, 140, ctx.signal, 'easeOutQuad');

    // 2) Leap up to the invisible ledge
    const ledgeY = start.y - 90;
    await animatePositionTimed(ctx.update, ctx.getState, start.x, ledgeY, 320, ctx.signal, 'easeOutQuad');

    // 3) Latch — brief held beat with a tiny sag as weight settles on the grip
    await animatePositionTimed(ctx.update, ctx.getState, start.x, ledgeY + 5, 140, ctx.signal, 'easeInOut');
    await wait(80, ctx.signal);

    // 4) Slip through the invisible hole — short pull-through followed by
    //    a single decisive rung up. Keep the jumping pose through the
    //    pull-through so the leg-tuck reads as squeezing through.
    await animatePositionTimed(ctx.update, ctx.getState, start.x, ledgeY - 18, 200, ctx.signal, 'easeInOut');

    // 5) Stepped retreat — climbing pose, alternating foot cycle. Crouch
    //    slightly (scale < 1) at the start of the retreat then continue
    //    shrinking + fading as the mascot recedes. Position and scale/
    //    opacity animate in parallel for a continuous "into the distance" feel.
    ctx.update({ pose: 'climbing', scale: 0.9 });
    const retreatX = ctx.getState().x;
    const retreatStartY = ctx.getState().y;
    const retreatEndY = retreatStartY - 80;

    await Promise.all([
        animateStepped(ctx, retreatX, retreatEndY, 4, 280, 40, 'easeInOut'),
        animateScaleOpacity(ctx.update, ctx.getState, 0.25, 0, 1200, ctx.signal),
    ]);

    ctx.update({ visible: false, pose: 'idle' });
}

/**
 * Walk away into the distance. Same stepping rhythm as climbing but with
 * a smaller vertical delta per step, so the feet clearly alternate while
 * the body recedes. Shrinks and fades in parallel.
 */
export async function walkAway(ctx: ActionContext): Promise<void> {
    const state = ctx.getState();
    // Turn around (face away — flip direction so we show the back).
    const awayFacing: QuillFacing = state.facing === 'right' ? 'left' : 'right';
    ctx.update({ facing: awayFacing, pose: 'walking' });

    const targetY = state.y - 110;
    // Six small upward rungs, each shorter than a climbing rung so the
    // gait reads as walking-into-the-distance rather than climbing.
    await Promise.all([
        animateStepped(ctx, state.x, targetY, 6, 360, 30, 'easeInOut'),
        animateScaleOpacity(ctx.update, ctx.getState, 0.2, 0, 2400, ctx.signal),
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
