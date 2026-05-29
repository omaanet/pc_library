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
    const resumeStateRef = useRef<{
        key: string;
        targetTime: number;
        attempts: number;
        stableChecks: number;
        completed: boolean;
        cancelled: boolean;
    } | null>(null);
    const resumeRetryRef = useRef<number | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    // Setup audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const clearResumeRetry = () => {
            if (resumeRetryRef.current !== null) {
                window.clearTimeout(resumeRetryRef.current);
                resumeRetryRef.current = null;
            }
        };

        const scheduleResumeRetry = () => {
            if (resumeRetryRef.current !== null) return;

            resumeRetryRef.current = window.setTimeout(() => {
                resumeRetryRef.current = null;
                applyInitialResume();
            }, 250);
        };

        const resetResumeState = () => {
            clearResumeRetry();
            resumeStateRef.current = null;
        };

        const applyInitialResume = () => {
            if (!Number.isFinite(initialTime) || initialTime <= 0) {
                resetResumeState();
                return;
            }

            const resumeKey = `${currentTrack}:${initialTime}`;
            if (resumeStateRef.current?.key !== resumeKey) {
                resumeStateRef.current = {
                    key: resumeKey,
                    targetTime: initialTime,
                    attempts: 0,
                    stableChecks: 0,
                    completed: false,
                    cancelled: false,
                };
            }

            const resumeState = resumeStateRef.current;
            if (!resumeState || resumeState.completed || resumeState.cancelled) return;

            const maxTime = Number.isFinite(audio.duration) && audio.duration > 0
                ? Math.max(0, audio.duration - 0.5)
                : resumeState.targetTime;
            const targetTime = Math.min(resumeState.targetTime, maxTime);

            try {
                audio.currentTime = targetTime;
            } catch {
                resumeState.stableChecks = 0;
                resumeState.attempts += 1;
                scheduleResumeRetry();
                return;
            }

            setCurrentTime(audio.currentTime);

            const isNearTarget = Math.abs(audio.currentTime - targetTime) <= 0.75;
            const isReadyEnough = audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

            if (isNearTarget && isReadyEnough) {
                resumeState.stableChecks += 1;
            } else {
                resumeState.stableChecks = 0;
            }

            if (resumeState.stableChecks >= 2 || (isNearTarget && resumeState.attempts >= 8)) {
                resumeState.completed = true;
                clearResumeRetry();
                return;
            }

            resumeState.attempts += 1;
            if (resumeState.attempts < 40) {
                scheduleResumeRetry();
            }
        };

        const setAudioData = () => {
            setDuration(audio.duration);
            applyInitialResume();
            setCurrentTime(audio.currentTime);
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        // Events
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('durationchange', setAudioData);
        audio.addEventListener('canplay', setAudioData);
        audio.addEventListener('seeked', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onTrackEnd);

        if (audio.readyState >= 1) {
            setAudioData();
        } else {
            applyInitialResume();
        }

        return () => {
            clearResumeRetry();
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('durationchange', setAudioData);
            audio.removeEventListener('canplay', setAudioData);
            audio.removeEventListener('seeked', setAudioData);
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

        const resumeState = resumeStateRef.current;
        if (
            resumeState &&
            !resumeState.completed &&
            Math.abs(audioRef.current.currentTime - resumeState.targetTime) > 0.75
        ) {
            resumeState.cancelled = true;
            if (resumeRetryRef.current !== null) {
                window.clearTimeout(resumeRetryRef.current);
                resumeRetryRef.current = null;
            }
        }

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
        if (resumeStateRef.current && !resumeStateRef.current.completed) {
            resumeStateRef.current.cancelled = true;
        }
        if (resumeRetryRef.current !== null) {
            window.clearTimeout(resumeRetryRef.current);
            resumeRetryRef.current = null;
        }
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
