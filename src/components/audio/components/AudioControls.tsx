// src/components/audio/components/AudioControls.tsx
// Play/pause, next, and previous buttons

import { ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';

interface AudioControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    disableNavigation: boolean;
}

/**
 * Audio playback control buttons
 */
export function AudioControls({
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    disableNavigation
}: AudioControlsProps) {
    return (
        <div className="player-controls flex flex-row flex-1 items-center justify-center relative">
            <button
                onClick={onPrev}
                disabled={disableNavigation}
                className="control-button hover:text-yellow-400"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="flex items-center">
                <button
                    onClick={onPlayPause}
                    className={`p-2 rounded-full mx-3 ${isPlaying ? 'bg-emerald-500 hover:bg-emerald-400 ' : 'bg-cyan-600 hover:bg-cyan-400'} text-white hover:text-black transition-colors duration-300 ease-in-out`}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
            </div>

            <button
                onClick={onNext}
                disabled={disableNavigation}
                className="control-button hover:text-yellow-400"
            >
                <ArrowRight size={20} />
            </button>
        </div>
    );
}
