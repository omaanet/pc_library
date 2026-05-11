/**
 * QuillTimeline — Records `QuillState` snapshots during a choreography
 * run, then replays them forward or in reverse via rAF.
 *
 * This is what makes the /animations-manager "reverse" button do real
 * scrubbing instead of guessing inverse actions: every position, scale,
 * pose, and facing change made by an action is captured at its wall-clock
 * offset and later resampled.
 */
import type { QuillState, QuillPose, QuillFacing } from './quill-actions';

export interface TimelineSnapshot {
    /** Milliseconds since the recording started */
    t: number;
    state: QuillState;
}

export class QuillTimeline {
    public snapshots: TimelineSnapshot[] = [];
    private startedAt = 0;
    private recording = false;

    /** Begin a fresh recording seeded with the current state at t=0 */
    start(initialState: QuillState): void {
        this.snapshots = [{ t: 0, state: { ...initialState } }];
        this.startedAt = performance.now();
        this.recording = true;
    }

    /** Append a snapshot — called from the controller's `update` */
    record(state: QuillState): void {
        if (!this.recording) return;
        const t = performance.now() - this.startedAt;
        this.snapshots.push({ t, state: { ...state } });
    }

    stop(): void {
        this.recording = false;
    }

    clear(): void {
        this.snapshots = [];
        this.recording = false;
    }

    get isRecording(): boolean {
        return this.recording;
    }

    get durationMs(): number {
        const last = this.snapshots[this.snapshots.length - 1];
        return last ? last.t : 0;
    }

    /**
     * Sample the timeline at a specific time offset. Numeric fields
     * (position, scale, opacity) are linearly interpolated between the
     * surrounding snapshots; discrete fields (pose, facing, visible) are
     * stepped from the latest snapshot at-or-before `t`.
     */
    sample(t: number): QuillState {
        const snaps = this.snapshots;
        if (snaps.length === 0) {
            throw new Error('QuillTimeline.sample: empty timeline');
        }
        if (snaps.length === 1 || t <= snaps[0].t) {
            return { ...snaps[0].state };
        }
        const lastIdx = snaps.length - 1;
        if (t >= snaps[lastIdx].t) {
            return { ...snaps[lastIdx].state };
        }

        // Find the bracketing pair (a, b) such that a.t <= t < b.t
        let i = 0;
        while (i < lastIdx && snaps[i + 1].t <= t) i++;
        const a = snaps[i];
        const b = snaps[i + 1] ?? a;
        const span = b.t - a.t;
        const ratio = span > 0 ? (t - a.t) / span : 0;

        return {
            x: lerp(a.state.x, b.state.x, ratio),
            y: lerp(a.state.y, b.state.y, ratio),
            scale: lerp(a.state.scale, b.state.scale, ratio),
            opacity: lerp(a.state.opacity, b.state.opacity, ratio),
            pose: stepDiscrete<QuillPose>(a.state.pose, b.state.pose, ratio),
            facing: stepDiscrete<QuillFacing>(a.state.facing, b.state.facing, ratio),
            visible: a.state.visible || b.state.visible,
        };
    }
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function stepDiscrete<T>(a: T, b: T, ratio: number): T {
    return ratio < 0.5 ? a : b;
}

export interface PlaybackOptions {
    direction?: 'forward' | 'reverse';
    /** Multiplier on real-time; 1 = realtime, 2 = double speed, 0.5 = half */
    speed?: number;
    signal?: AbortSignal;
}

/**
 * Drive `apply(state)` against `timeline` via rAF, respecting direction,
 * speed, and an optional abort signal. Resolves when playback ends.
 */
export function playTimeline(
    timeline: QuillTimeline,
    apply: (state: QuillState) => void,
    opts: PlaybackOptions = {},
): Promise<void> {
    const direction = opts.direction ?? 'forward';
    const speed = Math.max(0.0001, opts.speed ?? 1);
    const duration = timeline.durationMs;

    if (duration === 0 || timeline.snapshots.length === 0) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const startWall = performance.now();
        let rafId = 0;

        const onAbort = () => {
            cancelAnimationFrame(rafId);
            reject(new DOMException('Aborted', 'AbortError'));
        };
        opts.signal?.addEventListener('abort', onAbort, { once: true });

        const tick = (now: number) => {
            const elapsed = (now - startWall) * speed;
            if (elapsed >= duration) {
                apply(timeline.sample(direction === 'forward' ? duration : 0));
                opts.signal?.removeEventListener('abort', onAbort);
                resolve();
                return;
            }
            const t = direction === 'forward' ? elapsed : duration - elapsed;
            apply(timeline.sample(t));
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
    });
}
