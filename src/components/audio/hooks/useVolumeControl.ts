// src/components/audio/hooks/useVolumeControl.ts
// Volume control state and logic

import { useState, useRef, useEffect, RefObject } from 'react';

interface UseVolumeControlProps {
    audioRef: RefObject<HTMLAudioElement>;
    initialVolume: number; // 0-100
}

interface UseVolumeControlReturn {
    volume: number;
    muted: boolean;
    showVolumeSlider: boolean;
    volumeSliderRef: RefObject<HTMLDivElement>;
    volumeButtonRef: RefObject<HTMLButtonElement>;
    toggleMute: () => void;
    handleVolumeChange: (val: number) => void;
    handleVolumeButtonClick: () => void;
}

/**
 * Custom hook for managing volume control state and UI
 */
export function useVolumeControl({ audioRef, initialVolume }: UseVolumeControlProps): UseVolumeControlReturn {
    const [muted, setMuted] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(
        typeof initialVolume === 'number' ? Math.max(0, Math.min(1, initialVolume / 100)) : 0.25
    );
    const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
    const volumeSliderRef = useRef<HTMLDivElement>(null);
    const volumeButtonRef = useRef<HTMLButtonElement>(null);

    const toggleMute = (): void => setMuted(!muted);

    // Show/hide slider popup
    const handleVolumeButtonClick = () => {
        setShowVolumeSlider((s) => !s);
    };

    // Hide slider when clicking outside
    useEffect(() => {
        if (!showVolumeSlider) return;
        
        function handleClick(event: MouseEvent) {
            const target = event.target as Node;
            if (
                (volumeSliderRef.current && volumeSliderRef.current.contains(target)) ||
                (volumeButtonRef.current && volumeButtonRef.current.contains(target))
            ) {
                // Click inside slider or button, ignore
                return;
            }
            setShowVolumeSlider(false);
        }
        
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showVolumeSlider]);

    // Volume/Muted sync to audio
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.muted = muted || volume === 0;
        }
    }, [volume, muted, audioRef]);

    // When dragging slider
    const handleVolumeChange = (val: number) => {
        setVolume(val);
        if (val === 0) {
            setMuted(true);
        } else {
            setMuted(false);
        }
    };

    return {
        volume,
        muted,
        showVolumeSlider,
        volumeSliderRef,
        volumeButtonRef,
        toggleMute,
        handleVolumeChange,
        handleVolumeButtonClick
    };
}
