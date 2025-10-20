// src/components/audio/hooks/useAudioPlayer.ts
// Audio playback state and logic

import { useState, useRef, useEffect, RefObject } from 'react';

interface UseAudioPlayerProps {
    autoPlay: boolean;
    currentTrack: number;
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
export function useAudioPlayer({ autoPlay, currentTrack, onTrackEnd }: UseAudioPlayerProps): UseAudioPlayerReturn {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    // Setup audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        // Events
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onTrackEnd);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onTrackEnd);
        };
    }, [onTrackEnd]);

    // Handle track changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().catch(error => {
                    setIsPlaying(false);
                });
            }
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
