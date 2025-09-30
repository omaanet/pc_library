// src/components/audio/utils/formatTime.ts
// Time formatting utility for audio player

/**
 * Format time in seconds to MM:SS format
 * @param time - Time in seconds
 * @returns Formatted time string (e.g., "3:45")
 */
export function formatTime(time: number): string {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}
