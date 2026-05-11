/**
 * PlaybackControls — Transport bar for the animations manager.
 *
 * Behaviour by entry kind:
 *  - `pose`: Pause/Reverse/Speed apply to the held CSS pose animation.
 *  - `action` / `choreography`: Play runs and records the timeline;
 *     Replay re-runs OR replays the recorded timeline in forward/reverse;
 *     Pause freezes CSS pose animations on the sprite.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
    Play,
    Pause,
    RotateCcw,
    Rewind,
    FastForward,
    Square,
} from 'lucide-react';
import type { AnimationKind } from './animation-registry';

interface PlaybackControlsProps {
    kind: AnimationKind;
    isBusy: boolean;
    hasTimeline: boolean;
    isPaused: boolean;
    isReversed: boolean;
    speed: number;
    onPlay: () => void;
    onReplay: () => void;
    onStop: () => void;
    onTogglePause: () => void;
    onToggleReverse: () => void;
    onSpeedChange: (value: number) => void;
}

const SPEED_PRESETS = [0.25, 0.5, 1, 1.5, 2] as const;

export function PlaybackControls({
    kind,
    isBusy,
    hasTimeline,
    isPaused,
    isReversed,
    speed,
    onPlay,
    onReplay,
    onStop,
    onTogglePause,
    onToggleReverse,
    onSpeedChange,
}: PlaybackControlsProps) {
    const isPose = kind === 'pose';
    const canReplay = !isPose && hasTimeline;

    return (
        <div className="rounded-md border bg-card p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    onClick={onPlay}
                    disabled={isBusy}
                    size="sm"
                    className="gap-1.5"
                >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    {isPose ? 'Mostra' : 'Play'}
                </Button>

                {!isPose && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onReplay}
                        disabled={!canReplay || isBusy}
                        size="sm"
                        className="gap-1.5"
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Replay
                    </Button>
                )}

                <Button
                    type="button"
                    variant={isPaused ? 'default' : 'outline'}
                    onClick={onTogglePause}
                    size="sm"
                    className="gap-1.5"
                >
                    {isPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                    {isPaused ? 'Resume' : 'Pause'}
                </Button>

                <Button
                    type="button"
                    variant={isReversed ? 'default' : 'outline'}
                    onClick={onToggleReverse}
                    size="sm"
                    className="gap-1.5"
                >
                    <Rewind className="h-4 w-4" aria-hidden="true" />
                    Reverse
                </Button>

                {isBusy && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onStop}
                        size="sm"
                        className="gap-1.5 ml-auto"
                    >
                        <Square className="h-4 w-4" aria-hidden="true" />
                        Stop
                    </Button>
                )}
            </div>

            {/* Speed */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Velocità
                    </label>
                    <span className="text-sm tabular-nums font-mono">
                        {speed.toFixed(2)}&times;
                    </span>
                </div>
                <Slider
                    min={0.1}
                    max={3}
                    step={0.05}
                    value={[speed]}
                    onValueChange={(v) => onSpeedChange(v[0] ?? 1)}
                />
                <div className="flex flex-wrap gap-1">
                    {SPEED_PRESETS.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onSpeedChange(p)}
                            className={cn(
                                'text-[11px] px-2 py-0.5 rounded border tabular-nums transition-colors',
                                Math.abs(speed - p) < 0.01
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-accent',
                            )}
                        >
                            {p}&times;
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isPose
                    ? 'I controlli agiscono direttamente sulle animazioni CSS della posa: pausa, inversione e velocità in tempo reale.'
                    : 'Play registra una timeline degli stati. Replay la ripete in avanti o all\u2019indietro. Pause e Reverse agiscono anche sulle animazioni CSS della posa corrente.'}
            </p>

            {/* Icon-only hint shown when no timeline yet */}
            {!isPose && !hasTimeline && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <FastForward className="h-3 w-3" aria-hidden="true" />
                    Premi <span className="font-mono">Play</span> per registrare la prima esecuzione.
                </div>
            )}
        </div>
    );
}
