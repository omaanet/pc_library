// src/components/audio/hooks/useAudioPlayer.ts
// Audio playback state and logic

import { useState, useRef, useEffect, RefObject } from 'react';

interface UseAudioPlayerProps {
    autoPlay: boolean;
    currentTrack: number;
    initialTime?: number;
    onTrackEnd: () => void;
}

interface UseAudioPlayerReturn {
    audioRef: RefObject<HTMLAudioElement | null>;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    handlePlayPause: () => void;
    handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Custom hook for managing audio playback state and controls
 */
export function useAudioPlayer({ autoPlay, currentTrack, initialTime = 0, onTrackEnd }: UseAudioPlayerProps): UseAudioPlayerReturn {
    const audioRef = useRef<HTMLAudioElement>(null);
    const prevTrackRef = useRef(currentTrack);
    const initialSeekKeyRef = useRef<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    // Setup audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setInitialTime = () => {
            if (!Number.isFinite(initialTime) || initialTime <= 0) return;

            const seekKey = `${currentTrack}:${initialTime}`;
            if (initialSeekKeyRef.current === seekKey) return;

            const maxTime = Number.isFinite(audio.duration) && audio.duration > 0
                ? Math.max(0, audio.duration - 0.5)
                : initialTime;

            audio.currentTime = Math.min(initialTime, maxTime);
            initialSeekKeyRef.current = seekKey;
        };

        const setAudioData = () => {
            setDuration(audio.duration);
            setInitialTime();
            setCurrentTime(audio.currentTime);
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        // Events
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onTrackEnd);

        if (audio.readyState >= 1) {
            setAudioData();
        }

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onTrackEnd);
        };
    }, [currentTrack, initialTime, onTrackEnd]);

    // Handle track changes
    useEffect(() => {
        if (audioRef.current && prevTrackRef.current !== currentTrack) {
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().catch(error => {
                    setIsPlaying(false);
                });
            }
            prevTrackRef.current = currentTrack;
        }
    }, [currentTrack, isPlaying]);

    const handlePlayPause = (): void => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(error => {
                console.error('Failed to play:', error);
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    return {
        audioRef,
        isPlaying,
        currentTime,
        duration,
        handlePlayPause,
        handleSeek
    };
}
