/**
 * useQuillController — Imperative hook that exposes async methods
 * for controlling the free-roaming Quill mascot.
 *
 * Each method returns a Promise<void> that resolves when the action completes,
 * enabling clean chaining: await quill.enterFrom('left'); await quill.nod(3);
 *
 * Starting a new action automatically cancels the previous one via AbortController.
 */
'use client';

import { useRef, useCallback, useSyncExternalStore } from 'react';
import {
    type QuillState,
    type QuillEdge,
    type QuillFacing,
    type ActionContext,
    type MoveOptions,
    INITIAL_STATE,
    enterFrom as actionEnterFrom,
    moveTo as actionMoveTo,
    moveToElement as actionMoveToElement,
    run as actionRun,
    walkPath as actionWalkPath,
    turnTo as actionTurnTo,
    lookAround as actionLookAround,
    nod as actionNod,
    dance as actionDance,
    write as actionWrite,
    jumpAndEscape as actionJumpAndEscape,
    walkAway as actionWalkAway,
    leave as actionLeave,
    hide as actionHide,
} from './quill-actions';
import type { QuillTimeline } from './quill-timeline';

export interface QuillController {
    enterFrom: (edge: QuillEdge) => Promise<void>;
    moveTo: (x: number, y: number, speedOrOptions?: number | MoveOptions) => Promise<void>;
    moveToElement: (el: HTMLElement, offset?: { side?: QuillEdge; gap?: number }) => Promise<void>;
    run: (x: number, y: number, opts?: MoveOptions) => Promise<void>;
    walkPath: (points: { x: number; y: number }[], opts?: MoveOptions) => Promise<void>;
    turnTo: (facing: QuillFacing) => Promise<void>;
    lookAround: (duration?: number) => Promise<void>;
    nod: (count?: number) => Promise<void>;
    dance: (duration?: number) => Promise<void>;
    write: (duration?: number) => Promise<void>;
    jumpAndEscape: () => Promise<void>;
    walkAway: () => Promise<void>;
    leave: (edge?: QuillEdge) => Promise<void>;
    hide: () => void;

    /** Directly patch sprite state. Used by timeline playback and the
     *  manager page when previewing held poses. Does not abort current
     *  actions and does not get recorded into an attached timeline. */
    setState: (patch: Partial<QuillState>) => void;
    /** Cancel any running action. */
    abort: () => void;
    /** Read the current state imperatively. */
    getState: () => QuillState;

    /** Begin recording subsequent state changes into the timeline. */
    startRecording: (timeline: QuillTimeline) => void;
    /** Stop the current recording (the timeline keeps its snapshots). */
    stopRecording: () => void;
}

export interface UseQuillControllerReturn {
    controller: QuillController;
    state: QuillState;
}

export function useQuillController(): UseQuillControllerReturn {
    const stateRef = useRef<QuillState>({ ...INITIAL_STATE });
    const abortRef = useRef<AbortController | null>(null);
    const listenersRef = useRef<Set<() => void>>(new Set());
    const recordingRef = useRef<QuillTimeline | null>(null);

    const getState = useCallback(() => stateRef.current, []);

    const update = useCallback((patch: Partial<QuillState>) => {
        stateRef.current = { ...stateRef.current, ...patch };
        recordingRef.current?.record(stateRef.current);
        listenersRef.current.forEach((l) => l());
    }, []);

    /** Patch state without recording — used by timeline playback so the
     *  playback itself doesn't get fed back into the timeline. */
    const setStateDirect = useCallback((patch: Partial<QuillState>) => {
        stateRef.current = { ...stateRef.current, ...patch };
        listenersRef.current.forEach((l) => l());
    }, []);

    const subscribe = useCallback((listener: () => void) => {
        listenersRef.current.add(listener);
        return () => { listenersRef.current.delete(listener); };
    }, []);

    const state = useSyncExternalStore(subscribe, getState, getState);

    /** Cancel any running action and create fresh AbortController */
    const prepareAction = useCallback((): ActionContext => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        return { update, getState, signal: ac.signal };
    }, [update, getState]);

    /** Wrap an action so AbortError is silently swallowed */
    const run = useCallback(
        <A extends unknown[]>(
            fn: (ctx: ActionContext, ...args: A) => Promise<void>,
        ) =>
            async (...args: A): Promise<void> => {
                const ctx = prepareAction();
                try {
                    await fn(ctx, ...args);
                } catch (err) {
                    if (err instanceof DOMException && err.name === 'AbortError') return;
                    throw err;
                }
            },
        [prepareAction],
    );

    const controller = useRef<QuillController>({
        enterFrom: run(actionEnterFrom),
        moveTo: run(actionMoveTo),
        moveToElement: run(actionMoveToElement),
        run: run(actionRun),
        walkPath: run(actionWalkPath),
        turnTo: run(actionTurnTo),
        lookAround: run(actionLookAround),
        nod: run(actionNod),
        dance: run(actionDance),
        write: run(actionWrite),
        jumpAndEscape: run(actionJumpAndEscape),
        walkAway: run(actionWalkAway),
        leave: run(actionLeave),
        hide: () => {
            abortRef.current?.abort();
            const ctx = prepareAction();
            actionHide(ctx);
        },
        setState: setStateDirect,
        abort: () => abortRef.current?.abort(),
        getState,
        startRecording: (timeline: QuillTimeline) => {
            timeline.start(stateRef.current);
            recordingRef.current = timeline;
        },
        stopRecording: () => {
            recordingRef.current?.stop();
            recordingRef.current = null;
        },
    }).current;

    return { controller, state };
}
