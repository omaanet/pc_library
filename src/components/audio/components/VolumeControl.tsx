// src/components/audio/components/VolumeControl.tsx
// Volume control button and slider component

import { Volume2, VolumeX } from 'lucide-react';
import { RefObject } from 'react';

interface VolumeControlProps {
    volume: number;
    muted: boolean;
    showVolumeSlider: boolean;
    volumeSliderRef: RefObject<HTMLDivElement | null>;
    volumeButtonRef: RefObject<HTMLButtonElement | null>;
    onVolumeButtonClick: () => void;
    onVolumeChange: (val: number) => void;
}

/**
 * Volume control with button and popup slider
 */
export function VolumeControl({
    volume,
    muted,
    showVolumeSlider,
    volumeSliderRef,
    volumeButtonRef,
    onVolumeButtonClick,
    onVolumeChange
}: VolumeControlProps) {
    return (
        <div className="relative ms-3">
            <button
                ref={volumeButtonRef}
                onClick={onVolumeButtonClick}
                className="rounded-full align-middle my-1 hover:bg-opacity-20 hover:bg-gray-400 transition-colors duration-300 ease-in-out text-teal-500 hover:text-emerald-600 dark:text-teal-300 dark:hover:text-emerald-500"
                title={muted || volume === 0 ? "Unmute" : "Mute/Volume"}
                aria-label="Volume"
            >
                {(muted || volume === 0) ? <VolumeX size={21} /> : <Volume2 size={21} />}
            </button>
            {showVolumeSlider && (
                <div
                    ref={volumeSliderRef}
                    className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center z-50 mt-2"
                    style={{ minHeight: 60 }}
                >
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={muted ? 0 : volume}
                        onChange={e => onVolumeChange(Number(e.target.value))}
                        className="volume-slider"
                        style={{
                            WebkitAppearance: 'slider-vertical',
                            height: 60,
                        }}
                    />
                    <div className="text-xs mt-1 bg-gray-800 text-white rounded px-1 py-0.5 select-none" style={{ fontSize: '0.75rem' }}>
                        {Math.round((muted ? 0 : volume) * 100)}%
                    </div>
                </div>
            )}
            <style jsx>{`
              .volume-slider {
                writing-mode: vertical-lr;
                width: 24px;
                height: 60px;
                accent-color: #10b981;
                margin: 0 4px;
                cursor: pointer;
                background: transparent;
              }
              .volume-slider::-webkit-slider-thumb {
                background: #10b981;
                border-radius: 50%;
                border: none;
              }
              .volume-slider::-moz-range-thumb {
                background: #10b981;
                border-radius: 50%;
                border: none;
              }
              .volume-slider::-ms-thumb {
                background: #10b981;
                border-radius: 50%;
                border: none;
              }
            `}</style>
        </div>
    );
}
