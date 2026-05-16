/**
 * QuillStage — Page-level overlay that renders the free-roaming Quill mascot.
 *
 * Renders via createPortal into document.body as a fixed overlay with
 * pointer-events: none. Supports configurable triggers (load/click/manual)
 * and frequency (once/always/random).
 *
 * Usage:
 *   <QuillStage
 *     trigger={{ type: 'load', delay: 3000 }}
 *     choreography="peek-and-leave"
 *     frequency="once"
 *   />
 */
'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { QuillSprite } from './quill-sprite';
import { useQuillController } from './use-quill-controller';
import {
    runChoreography,
    type ChoreographyName,
    type ChoreographyOptions,
    type EntryAndExistSideOptions,
} from './quill-choreographies';

// ─── Trigger types ──────────────────────────────────────────────────────

export type QuillTrigger =
    | { type: 'load'; delay?: number }
    | { type: 'click'; targetRef: RefObject<HTMLElement | null> }
    | { type: 'manual' };

export type QuillFrequency =
    | 'once'
    | 'always'
    | { type: 'random'; probability: number };

// ─── Props ──────────────────────────────────────────────────────────────

interface QuillStageProps {
    trigger: QuillTrigger;
    choreography: ChoreographyName;
    targetId?: string;
    options?: EntryAndExistSideOptions;
    choreographyOptions?: ChoreographyOptions;
    frequency?: QuillFrequency;
    /** Unique key for sessionStorage when frequency='once' */
    id?: string;
    onComplete?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getStorageKey(id: string): string {
    return `quill-played-${id}`;
}

function hasPlayed(id: string): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(getStorageKey(id)) === '1';
}

function markPlayed(id: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(getStorageKey(id), '1');
}

function shouldPlay(frequency: QuillFrequency, id: string): boolean {
    if (frequency === 'always') return true;
    if (frequency === 'once') return !hasPlayed(id);
    // random
    return Math.random() < frequency.probability;
}

/** Check reduced motion preference */
function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isElementVisibleInViewport(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }

    if (element.getClientRects().length === 0) {
        return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
        return false;
    }

    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth
    );
}

function normalizeTargetId(id: string): string {
    if (id.startsWith('@#')) return id.slice(2);
    if (id.startsWith('#')) return id.slice(1);
    return id;
}

function passesVisibilityGuard(targetId?: string): boolean {
    if (typeof document === 'undefined' || typeof window === 'undefined') return true;
    if (!targetId?.startsWith('@#')) return true;

    const normalizedTargetId = normalizeTargetId(targetId).trim();
    if (!normalizedTargetId) return false;

    try {
        const element = document.getElementById(normalizedTargetId);
        return element ? isElementVisibleInViewport(element) : false;
    } catch {
        return false;
    }
}

function getLegacyTargetId(id: string): string | undefined {
    if (!id.startsWith('@#') || id.length <= 2) return undefined;
    return id.trim() || undefined;
}

// ─── Component ──────────────────────────────────────────────────────────

export function QuillStage({
    trigger,
    choreography,
    targetId,
    options,
    choreographyOptions,
    frequency = 'always',
    id,
    onComplete,
}: QuillStageProps) {
    const { controller, state } = useQuillController();
    const [mounted, setMounted] = useState(false);
    const hasStartedRef = useRef(false);
    const stageId = id ?? choreography;

    // Portal needs client-side mount
    useEffect(() => {
        setMounted(true);
    }, []);

    const startChoreography = useRef<() => Promise<void>>(async () => undefined);

    // Keep ref in sync
    useEffect(() => {
        startChoreography.current = async () => {
            if (hasStartedRef.current) return;
            if (prefersReducedMotion()) return;
            if (!shouldPlay(frequency, stageId)) return;

            const hasExplicitTarget =
                choreographyOptions?.target !== undefined ||
                choreographyOptions?.targetId !== undefined ||
                options?.target !== undefined ||
                options?.targetId !== undefined ||
                targetId !== undefined;
            const legacyTargetId = hasExplicitTarget ? undefined : getLegacyTargetId(stageId);
            const mergedTargetId = targetId ?? options?.targetId ?? choreographyOptions?.targetId ?? legacyTargetId;
            const opts: ChoreographyOptions = {
                ...choreographyOptions,
                ...options,
                targetId: mergedTargetId ? normalizeTargetId(mergedTargetId) : undefined,
                onTouch: choreographyOptions?.onTouch ?? (() => {
                    const selector = choreographyOptions?.bookSelector ?? '[data-book-card]';
                    const cards = document.querySelectorAll<HTMLElement>(selector);
                    cards.forEach((card) => {
                        card.classList.add('quill-touch-shake');
                        setTimeout(() => card.classList.remove('quill-touch-shake'), 600);
                    });
                }),
            };

            if (!passesVisibilityGuard(mergedTargetId)) return;

            hasStartedRef.current = true;

            if (frequency === 'once') {
                markPlayed(stageId);
            }

            try {
                await runChoreography(choreography, controller, opts);
            } finally {
                onComplete?.();
            }
        };
    });

    // ── Load trigger ──
    useEffect(() => {
        if (trigger.type !== 'load') return;
        const delay = trigger.delay ?? 0;
        const timer = setTimeout(() => {
            startChoreography.current();
        }, delay);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger.type]);

    // ── Click trigger ──
    useEffect(() => {
        if (trigger.type !== 'click') return;
        const el = trigger.targetRef?.current;
        if (!el) return;

        const handler = () => {
            hasStartedRef.current = false; // allow re-trigger on click
            startChoreography.current();
        };
        el.addEventListener('click', handler);
        return () => el.removeEventListener('click', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger.type]);

    if (!mounted || !state.visible) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
            aria-hidden="true"
        >
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: `translate(${state.x}px, ${state.y}px)`,
                    willChange: 'transform',
                }}
            >
                <QuillSprite
                    pose={state.pose}
                    facing={state.facing}
                    scale={state.scale}
                    opacity={state.opacity}
                />
            </div>
        </div>,
        document.body,
    );
}
