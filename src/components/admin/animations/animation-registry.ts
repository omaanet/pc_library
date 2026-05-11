/**
 * Registry of every animation exposed by /animations-manager.
 *
 * Three kinds of entries:
 *  - `pose`: a held pose (sprite stays still, CSS keyframes loop)
 *  - `action`: a single imperative action from quill-actions.ts
 *  - `choreography`: a named sequence from quill-choreographies.ts
 *
 * Each non-pose entry is wrapped with a known starting state so it
 * plays nicely in isolation on the manager preview stage.
 */
'use client';

import type { QuillController } from '@/components/mascots/use-quill-controller';
import type { QuillPose } from '@/components/mascots/quill-actions';
import {
    bookInspect,
    peekAndLeave,
    wanderAndDance,
    writeAndLeave,
    walkToward,
} from '@/components/mascots/quill-choreographies';

/** DOM ids of the preview-zone targets rendered by the manager UI. */
export const PREVIEW_TARGET_IDS = ['quill-target-a', 'quill-target-b', 'quill-target-c'] as const;

export type AnimationKind = 'pose' | 'action' | 'choreography';
export type AnimationGroup = 'Poses' | 'Actions' | 'Choreographies';

export interface AnimationEntryBase {
    id: string;
    name: string;
    group: AnimationGroup;
    description: string;
}

export interface PoseEntry extends AnimationEntryBase {
    kind: 'pose';
    pose: QuillPose;
}

/** Runtime context passed to entry `play` functions by the manager UI. */
export interface PlayContext {
    /** DOM id chosen via the manager's target picker, or null for auto. */
    targetId?: string | null;
}

export interface ActionEntry extends AnimationEntryBase {
    kind: 'action';
    /** Snippet shown in the metadata panel for copy/paste */
    snippet: string;
    play: (c: QuillController, ctx?: PlayContext) => Promise<void>;
}

export interface ChoreographyEntry extends AnimationEntryBase {
    kind: 'choreography';
    snippet: string;
    play: (c: QuillController, ctx?: PlayContext) => Promise<void>;
    /** True when the entry honours `ctx.targetId` from the picker. */
    usesTarget?: boolean;
}

export type AnimationEntry = PoseEntry | ActionEntry | ChoreographyEntry;

/** Place the mascot at a known starting state before an action runs. */
function placeOnGround(c: QuillController, opts?: { x?: number; pose?: QuillPose; facing?: 'left' | 'right' }) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
    c.setState({
        visible: true,
        x: opts?.x ?? vw * 0.5,
        y: vh * 0.78,
        scale: 1.4,
        opacity: 1,
        pose: opts?.pose ?? 'idle',
        facing: opts?.facing ?? 'right',
    });
}

export const ANIMATION_REGISTRY: AnimationEntry[] = [
    // ── Poses ─────────────────────────────────────────────────────────────
    { id: 'pose-idle', kind: 'pose', group: 'Poses', name: 'Idle', pose: 'idle',
        description: 'Fluttua dolcemente, batte le ciglia e fa ondeggiare le piume.' },
    { id: 'pose-walking', kind: 'pose', group: 'Poses', name: 'Walking', pose: 'walking',
        description: 'Andatura coordinata con bilanciamento del corpo e leggera inclinazione in avanti.' },
    { id: 'pose-running', kind: 'pose', group: 'Poses', name: 'Running', pose: 'running',
        description: 'Falcata ampia, ciclo veloce, forte inclinazione in avanti.' },
    { id: 'pose-looking', kind: 'pose', group: 'Poses', name: 'Looking Around', pose: 'looking',
        description: 'Sguardo curioso a sinistra e a destra con leggera inclinazione della testa.' },
    { id: 'pose-nodding', kind: 'pose', group: 'Poses', name: 'Nodding', pose: 'nodding',
        description: 'Annuisce ripetutamente.' },
    { id: 'pose-dancing', kind: 'pose', group: 'Poses', name: 'Dancing', pose: 'dancing',
        description: 'Salti veloci e oscillazioni festose.' },
    { id: 'pose-writing', kind: 'pose', group: 'Poses', name: 'Writing', pose: 'writing',
        description: 'Si abbassa ritmicamente come per scrivere; l\u2019inchiostro pulsa sotto.' },
    { id: 'pose-jumping', kind: 'pose', group: 'Poses', name: 'Jumping', pose: 'jumping',
        description: 'Anticipazione, lancio, apice, atterraggio con schiacciamento.' },

    // ── Actions ───────────────────────────────────────────────────────────
    {
        id: 'action-enter-left', kind: 'action', group: 'Actions', name: 'Enter from Left',
        description: 'Entra camminando dal lato sinistro dello schermo.',
        snippet: `await quill.enterFrom('left');`,
        play: async (c) => { c.setState({ visible: false }); await c.enterFrom('left'); },
    },
    {
        id: 'action-enter-right', kind: 'action', group: 'Actions', name: 'Enter from Right',
        description: 'Entra camminando dal lato destro dello schermo.',
        snippet: `await quill.enterFrom('right');`,
        play: async (c) => { c.setState({ visible: false }); await c.enterFrom('right'); },
    },
    {
        id: 'action-enter-top', kind: 'action', group: 'Actions', name: 'Enter from Top',
        description: 'Scende dall\u2019alto camminando.',
        snippet: `await quill.enterFrom('top');`,
        play: async (c) => { c.setState({ visible: false }); await c.enterFrom('top'); },
    },
    {
        id: 'action-enter-bottom', kind: 'action', group: 'Actions', name: 'Enter from Bottom',
        description: 'Sale dal basso dello schermo.',
        snippet: `await quill.enterFrom('bottom');`,
        play: async (c) => { c.setState({ visible: false }); await c.enterFrom('bottom'); },
    },
    {
        id: 'action-move', kind: 'action', group: 'Actions', name: 'Walk to Center',
        description: 'Cammina da sinistra fino al centro dello schermo.',
        snippet: `await quill.moveTo(window.innerWidth * 0.5, window.innerHeight * 0.78);`,
        play: async (c) => {
            placeOnGround(c, { x: window.innerWidth * 0.1 });
            await c.moveTo(window.innerWidth * 0.5, window.innerHeight * 0.78);
        },
    },
    {
        id: 'action-run', kind: 'action', group: 'Actions', name: 'Run Across',
        description: 'Corre velocemente attraverso lo schermo con un\u2019ampia falcata.',
        snippet: `await quill.run(window.innerWidth * 0.95, window.innerHeight * 0.78);`,
        play: async (c) => {
            placeOnGround(c, { x: window.innerWidth * 0.05 });
            await c.run(window.innerWidth * 0.95, window.innerHeight * 0.78);
        },
    },
    {
        id: 'action-walk-path', kind: 'action', group: 'Actions', name: 'Walk Path (square)',
        description: 'Percorre un quadrato attraversando quattro waypoint.',
        snippet: `await quill.walkPath([{x,y}, {x,y}, {x,y}, {x,y}]);`,
        play: async (c) => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            placeOnGround(c, { x: vw * 0.25 });
            await c.walkPath([
                { x: vw * 0.75, y: vh * 0.78 },
                { x: vw * 0.75, y: vh * 0.45 },
                { x: vw * 0.25, y: vh * 0.45 },
                { x: vw * 0.25, y: vh * 0.78 },
            ]);
        },
    },
    {
        id: 'action-turn', kind: 'action', group: 'Actions', name: 'Turn Around',
        description: 'Gira sul posto, inverte la direzione, poi torna.',
        snippet: `await quill.turnTo('left'); await quill.turnTo('right');`,
        play: async (c) => {
            placeOnGround(c);
            await c.turnTo('left');
            await c.turnTo('right');
        },
    },
    {
        id: 'action-look-around', kind: 'action', group: 'Actions', name: 'Look Around',
        description: 'Si guarda intorno con curiosit\u00e0 per qualche secondo.',
        snippet: `await quill.lookAround(2500);`,
        play: async (c) => { placeOnGround(c); await c.lookAround(2500); },
    },
    {
        id: 'action-nod', kind: 'action', group: 'Actions', name: 'Nod',
        description: 'Annuisce tre volte.',
        snippet: `await quill.nod(3);`,
        play: async (c) => { placeOnGround(c); await c.nod(3); },
    },
    {
        id: 'action-dance', kind: 'action', group: 'Actions', name: 'Dance',
        description: 'Balla per tre secondi.',
        snippet: `await quill.dance(3000);`,
        play: async (c) => { placeOnGround(c); await c.dance(3000); },
    },
    {
        id: 'action-write', kind: 'action', group: 'Actions', name: 'Write',
        description: 'Scrive per quattro secondi mentre l\u2019inchiostro pulsa.',
        snippet: `await quill.write(4000);`,
        play: async (c) => { placeOnGround(c); await c.write(4000); },
    },
    {
        id: 'action-jump-escape', kind: 'action', group: 'Actions', name: 'Jump & Escape',
        description: 'Anticipa, salta e fugge fuori dallo schermo.',
        snippet: `await quill.jumpAndEscape();`,
        play: async (c) => { placeOnGround(c); await c.jumpAndEscape(); },
    },
    {
        id: 'action-walk-away', kind: 'action', group: 'Actions', name: 'Walk Away',
        description: 'Si allontana in profondit\u00e0 rimpicciolendosi e sfumando.',
        snippet: `await quill.walkAway();`,
        play: async (c) => { placeOnGround(c); await c.walkAway(); },
    },
    {
        id: 'action-leave-left', kind: 'action', group: 'Actions', name: 'Leave Left',
        description: 'Esce dallo schermo a sinistra.',
        snippet: `await quill.leave('left');`,
        play: async (c) => { placeOnGround(c); await c.leave('left'); },
    },
    {
        id: 'action-leave-right', kind: 'action', group: 'Actions', name: 'Leave Right',
        description: 'Esce dallo schermo a destra.',
        snippet: `await quill.leave('right');`,
        play: async (c) => { placeOnGround(c); await c.leave('right'); },
    },

    // ── Choreographies ────────────────────────────────────────────────────
    {
        id: 'choreo-peek-and-leave', kind: 'choreography', group: 'Choreographies', name: 'Peek and Leave',
        description: 'Entra da sinistra, si guarda intorno, esce a destra.',
        snippet: `<QuillStage choreography="peek-and-leave" trigger={{ type: 'load' }} />`,
        play: async (c) => { c.setState({ visible: false }); await peekAndLeave(c); },
    },
    {
        id: 'choreo-wander-and-dance', kind: 'choreography', group: 'Choreographies', name: 'Wander and Dance',
        description: 'Entra, raggiunge il centro, balla, poi salta via.',
        snippet: `<QuillStage choreography="wander-and-dance" trigger={{ type: 'load' }} />`,
        play: async (c) => { c.setState({ visible: false }); await wanderAndDance(c); },
    },
    {
        id: 'choreo-write-and-leave', kind: 'choreography', group: 'Choreographies', name: 'Write and Leave',
        description: 'Entra da destra, scrive, esce a destra.',
        snippet: `<QuillStage choreography="write-and-leave" trigger={{ type: 'load' }} />`,
        play: async (c) => { c.setState({ visible: false }); await writeAndLeave(c); },
    },
    {
        id: 'choreo-book-inspect', kind: 'choreography', group: 'Choreographies', name: 'Book Inspect',
        description:
            'Ispeziona un elemento bersaglio. Se nel selettore bersagli è impostato “Auto”, cerca una book card sulla pagina; se non la trova, ripiega su peek-and-leave.',
        snippet: `<QuillStage choreography="book-inspect" trigger={{ type: 'load' }} />`,
        usesTarget: true,
        play: async (c, ctx) => {
            c.setState({ visible: false });
            // Picker override → inspect the chosen target element.
            if (ctx?.targetId) {
                const el = document.getElementById(ctx.targetId);
                if (el) {
                    await bookInspect(c, el);
                    return;
                }
            }
            // Auto → first book card on the page, else fallback.
            const card = document.querySelector<HTMLElement>('[data-book-card]');
            if (card) {
                await bookInspect(c, card);
            } else {
                await peekAndLeave(c);
            }
        },
    },
    {
        id: 'choreo-walk-toward', kind: 'choreography', group: 'Choreographies', name: 'Walk Toward',
        description:
            'Cammina verso un elemento bersaglio individuato dal suo ID (rispettando il bounding box con un piccolo margine). Se non viene fornito un bersaglio, raggiunge il centro della pagina.',
        snippet: `await walkToward(quill, document.getElementById('quill-target-a'));`,
        usesTarget: true,
        play: async (c, ctx) => {
            c.setState({ visible: false });
            // Picker override wins; otherwise pick the first available preview target.
            const id =
                ctx?.targetId ??
                PREVIEW_TARGET_IDS.find((tid) => document.getElementById(tid));
            const el = id ? document.getElementById(id) : null;
            await walkToward(c, el);
        },
    },
];

export const ANIMATION_GROUPS: AnimationGroup[] = ['Poses', 'Actions', 'Choreographies'];

export function findEntry(id: string): AnimationEntry {
    return ANIMATION_REGISTRY.find((e) => e.id === id) ?? ANIMATION_REGISTRY[0];
}
