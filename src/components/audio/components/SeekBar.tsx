// src/components/audio/components/SeekBar.tsx
// Progress/seek bar component

interface SeekBarProps {
    currentTime: number;
    duration: number;
    onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Seek bar for audio playback progress
 */
export function SeekBar({ currentTime, duration, onSeek }: SeekBarProps) {
    return (
        <input
            type="range"
            className="seek-slider"
            min="0"
            max={duration || 0}
            step="0.01"
            value={currentTime}
            onChange={onSeek}
            style={{ width: '100%' }}
        />
    );
}
