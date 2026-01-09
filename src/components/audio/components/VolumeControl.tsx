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
    const displayVolume = muted ? 0 : volume;

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
                    className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center z-50 mb-0 px-4 py-2 rounded-[5px] bg-gray-800/90 backdrop-blur-sm shadow-xl border border-white/10"
                    style={{ width: '28px' }}
                >
                    <span className="text-[8px] text-white/90 font-bold mb-1 select-none leading-none">
                        {Math.round(displayVolume * 100)}%
                    </span>
                    <div className="relative h-[60px] w-3 flex items-center justify-center overflow-hidden rounded-[2px]">
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={displayVolume}
                            onChange={e => onVolumeChange(Number(e.target.value))}
                            className="volume-slider-vertical"
                            style={{
                                '--volume-percent': `${displayVolume * 100}%`
                            } as React.CSSProperties}
                        />
                    </div>
                </div>
            )}
            <style jsx>{`
              .volume-slider-vertical {
                -webkit-appearance: none;
                appearance: none;
                width: 60px;
                height: 12px;
                background: #374151;
                border-radius: 2px;
                outline: none;
                margin: 0;
                transform: rotate(-90deg);
                cursor: pointer;
                position: absolute;
              }

              /* Track fill effect - Horizontal gradient before rotation */
              .volume-slider-vertical {
                background: linear-gradient(
                  to right,
                  #10b981 0%,
                  #10b981 var(--volume-percent),
                  #374151 var(--volume-percent),
                  #374151 100%
                );
              }

              .volume-slider-vertical::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                background: #10b981;
                border: 1px solid #064e3b;
                border-radius: 50%;
                cursor: pointer;
              }

              .volume-slider-vertical::-moz-range-thumb {
                width: 12px;
                height: 12px;
                background: #10b981;
                border: 1px solid #064e3b;
                border-radius: 50%;
                cursor: pointer;
              }
            `}</style>
        </div>
    );
}
