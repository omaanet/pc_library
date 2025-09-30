// src/components/audio/components/TimeDisplay.tsx
// Current time and duration display component

import { formatTime } from '../utils/formatTime';

interface TimeDisplayProps {
    currentTime: number;
    duration: number;
}

/**
 * Displays current playback time and total duration
 */
export function TimeDisplay({ currentTime, duration }: TimeDisplayProps) {
    return (
        <div className="time-display flex-1 text-end font-light">
            {formatTime(currentTime)} / {formatTime(duration)}
        </div>
    );
}
