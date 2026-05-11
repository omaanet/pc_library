/**
 * AnimationManager — Main UI for /animations-manager.
 *
 * Layout: left rail (registry list) + right column (metadata + transport
 * controls). The mascot is rendered into a viewport-fixed portal so its
 * positions are interpreted in window coordinates, matching the public
 * QuillStage rendering exactly.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuillSprite } from '@/components/mascots/quill-sprite';
import { useQuillController } from '@/components/mascots/use-quill-controller';
import { QuillTimeline, playTimeline } from '@/components/mascots/quill-timeline';
import {
    ANIMATION_REGISTRY,
    PREVIEW_TARGET_IDS,
    findEntry,
    type AnimationEntry,
} from './animation-registry';
import { AnimationList } from './animation-list';
import { PlaybackControls } from './playback-controls';

const KIND_LABEL: Record<AnimationEntry['kind'], string> = {
    pose: 'Posa',
    action: 'Azione',
    choreography: 'Coreografia',
};

export function AnimationManager() {
    const { controller, state } = useQuillController();
    const [selectedId, setSelectedId] = useState<string>(ANIMATION_REGISTRY[0].id);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isReversed, setIsReversed] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [hasTimeline, setHasTimeline] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [copied, setCopied] = useState(false);

    const timelineRef = useRef<QuillTimeline>(new QuillTimeline());
    const playbackAbortRef = useRef<AbortController | null>(null);

    // The portal target needs to wait until after mount so SSR doesn't crash.
    useEffect(() => setMounted(true), []);

    const selected = useMemo<AnimationEntry>(() => findEntry(selectedId), [selectedId]);

    const stopPlayback = useCallback(() => {
        playbackAbortRef.current?.abort();
        playbackAbortRef.current = null;
        controller.abort();
        controller.stopRecording();
        setIsBusy(false);
    }, [controller]);

    const showHeldPose = useCallback(
        (entry: AnimationEntry) => {
            if (entry.kind !== 'pose') return;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            controller.setState({
                visible: true,
                x: vw * 0.5 - 50,
                y: vh * 0.55,
                scale: 2.0,
                opacity: 1,
                pose: entry.pose,
                facing: 'right',
            });
        },
        [controller],
    );

    // Selection change → reset transport, hide or hold-pose-init the sprite
    useEffect(() => {
        stopPlayback();
        timelineRef.current.clear();
        setHasTimeline(false);
        setIsReversed(false);
        setIsPaused(false);
        if (selected.kind === 'pose') {
            showHeldPose(selected);
        } else {
            controller.setState({ visible: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const playSelected = useCallback(async () => {
        stopPlayback();

        if (selected.kind === 'pose') {
            showHeldPose(selected);
            return;
        }

        controller.setState({ visible: false });
        timelineRef.current = new QuillTimeline();
        controller.startRecording(timelineRef.current);
        setIsBusy(true);
        try {
            await selected.play(controller, { targetId: selectedTargetId });
            setHasTimeline(timelineRef.current.snapshots.length > 1);
        } catch (err) {
            if (!(err instanceof DOMException && err.name === 'AbortError')) throw err;
        } finally {
            controller.stopRecording();
            setIsBusy(false);
        }
    }, [selected, controller, showHeldPose, stopPlayback, selectedTargetId]);

    const replay = useCallback(async () => {
        if (selected.kind === 'pose') {
            showHeldPose(selected);
            return;
        }
        if (timelineRef.current.snapshots.length < 2) {
            await playSelected();
            return;
        }
        stopPlayback();
        const ac = new AbortController();
        playbackAbortRef.current = ac;
        setIsBusy(true);
        try {
            await playTimeline(timelineRef.current, controller.setState, {
                direction: isReversed ? 'reverse' : 'forward',
                speed,
                signal: ac.signal,
            });
        } catch (err) {
            if (!(err instanceof DOMException && err.name === 'AbortError')) throw err;
        } finally {
            playbackAbortRef.current = null;
            setIsBusy(false);
        }
    }, [selected, controller, isReversed, speed, playSelected, stopPlayback, showHeldPose]);

    const handleCopySnippet = useCallback(async () => {
        const snippet =
            selected.kind === 'pose'
                ? `<QuillSprite pose="${selected.pose}" facing="right" />`
                : selected.snippet;
        try {
            await navigator.clipboard.writeText(snippet);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard may be unavailable in older browsers — silently ignore
        }
    }, [selected]);

    return (
        <div className="container mx-auto p-6 lg:p-10">
            <div className="flex items-center gap-4 mb-6">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/" aria-label="Torna alla Home">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Gestore Animazioni Quill</h1>
            </div>

            <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
                Anteprima ogni posa, azione e coreografia del personaggio.
                I controlli di trasporto consentono di mettere in pausa, invertire la riproduzione
                e modificare la velocità in tempo reale. Le azioni e le coreografie vengono
                registrate in una timeline, riproducibile in avanti o all&rsquo;indietro.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                <AnimationList
                    entries={ANIMATION_REGISTRY}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />

                <div className="space-y-4">
                    {/* Metadata panel */}
                    <div className="rounded-md border bg-card p-4">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-lg font-semibold">{selected.name}</h2>
                                    <span className="text-[10px] uppercase tracking-wider rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                                        {KIND_LABEL[selected.kind]}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {selected.description}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCopySnippet}
                                className="gap-1.5 shrink-0"
                            >
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                {copied ? 'Copiato!' : 'Copia snippet'}
                            </Button>
                        </div>

                        <pre className="mt-3 text-[12px] leading-snug rounded bg-muted/50 px-3 py-2 overflow-x-auto font-mono">
                            {selected.kind === 'pose'
                                ? `<QuillSprite pose="${selected.pose}" facing="right" />`
                                : selected.snippet}
                        </pre>
                    </div>

                    <PlaybackControls
                        kind={selected.kind}
                        isBusy={isBusy}
                        hasTimeline={hasTimeline}
                        isPaused={isPaused}
                        isReversed={isReversed}
                        speed={speed}
                        onPlay={playSelected}
                        onReplay={replay}
                        onStop={stopPlayback}
                        onTogglePause={() => setIsPaused((p) => !p)}
                        onToggleReverse={() => setIsReversed((r) => !r)}
                        onSpeedChange={setSpeed}
                    />

                    {/* Preview targets — used by target-based sequences such as
                        "Book Inspect" and "Walk Toward". The mascot is rendered
                        in a viewport-fixed portal, so these tiles act as on-page
                        anchors identified by stable DOM ids. Clicking a tile
                        selects it as the bersaglio for the next playback. */}
                    <div className="rounded-md border border-dashed bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                            <p className="text-xs text-muted-foreground max-w-md">
                                Bersagli di anteprima. Le coreografie con bersaglio
                                (es. <em>Walk Toward</em>, <em>Book Inspect</em>) usano il riquadro
                                selezionato qui sotto. In modalità <em>Auto</em> la coreografia sceglie
                                un bersaglio automaticamente o ripiega sul centro della pagina.
                                {selected.kind === 'choreography' && !selected.usesTarget && (
                                    <span className="block mt-1 italic">
                                        La coreografia selezionata non utilizza un bersaglio.
                                    </span>
                                )}
                            </p>
                            <label className="text-xs flex items-center gap-2">
                                <span className="text-muted-foreground">Bersaglio:</span>
                                <select
                                    value={selectedTargetId ?? ''}
                                    onChange={(e) => setSelectedTargetId(e.target.value || null)}
                                    className="rounded border bg-background px-2 py-1 text-xs font-mono"
                                >
                                    <option value="">Auto</option>
                                    {PREVIEW_TARGET_IDS.map((id, i) => (
                                        <option key={id} value={id}>
                                            Target {String.fromCharCode(65 + i)} (#{id})
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {PREVIEW_TARGET_IDS.map((id, i) => {
                                const isSelected = selectedTargetId === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        id={id}
                                        data-quill-target
                                        aria-pressed={isSelected}
                                        onClick={() =>
                                            setSelectedTargetId((prev) => (prev === id ? null : id))
                                        }
                                        className={[
                                            'h-20 rounded-md border flex flex-col items-center justify-center text-xs font-mono transition-colors',
                                            isSelected
                                                ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                                                : 'border-border bg-card hover:bg-muted/40',
                                        ].join(' ')}
                                    >
                                        <span className="font-semibold">
                                            Target {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="text-muted-foreground">#{id}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mascot overlay — fixed to the viewport like QuillStage */}
            {mounted && state.visible &&
                createPortal(
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 40,
                            pointerEvents: 'none',
                            overflow: 'hidden',
                        }}
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
                                paused={isPaused}
                                reversed={isReversed}
                                speedScale={1 / Math.max(0.1, speed)}
                            />
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
