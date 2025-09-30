// src/components/audio/components/TrackInfo.tsx
// Track title display component

import type { Track } from '../types';

interface TrackInfoProps {
    track: Track;
}

/**
 * Displays the current track title
 */
export function TrackInfo({ track }: TrackInfoProps) {
    return (
        <div className="flex-1 text-start font-medium">
            {track.title}
        </div>
    );
}
