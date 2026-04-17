// src/components/audio/utils/formatTime.ts
// Time formatting utility for audio player

/**
 * Format time in seconds to M:SS or HH:MM:SS format.
 * @param time - Time in seconds
 * @returns Formatted time string (e.g., "3:45" or "01:06:06")
 */
export function formatTime(time: number): string {
    if (!Number.isFinite(time) || time < 0) return '0:00';

    const totalSeconds = Math.floor(time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0'),
        ].join(':');
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
