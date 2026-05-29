// src/components/audio/hooks/useAudioPlayer.ts
// Audio playback state and logic

import { useState, useRef, useEffect, RefObject } from 'react';
import type { AudioResumeStatus } from '../types';

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
    resumeStatus: AudioResumeStatus;
    handlePlayPause: () => void;
    handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ResumeState {
    key: string;
    targetTime: number;
    attempts: number;
    stableChecks: number;
    status: AudioResumeStatus;
}

const RESUME_RETRY_MS = 250;
const RESUME_MAX_ATTEMPTS = 40;
const RESUME_TOLERANCE_SECONDS = 0.75;

/**
 * Custom hook for managing audio playback state and controls
 */
export function useAudioPlayer({ autoPlay, currentTrack, initialTime = 0, onTrackEnd }: UseAudioPlayerProps): UseAudioPlayerReturn {
    const audioRef = useRef<HTMLAudioElement>(null);
    const prevTrackRef = useRef(currentTrack);
    const onTrackEndRef = useRef(onTrackEnd);
    const resumeStateRef = useRef<ResumeState | null>(null);
    const resumeRetryRef = useRef<number | null>(null);
    const attemptResumeNowRef = useRef<(() => AudioResumeStatus) | null>(null);
    const playAfterResumeRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [resumeStatus, setResumeStatus] = useState<AudioResumeStatus>(
        Number.isFinite(initialTime) && initialTime > 0 ? 'pending' : 'skipped'
    );

    useEffect(() => {
        onTrackEndRef.current = onTrackEnd;
    }, [onTrackEnd]);

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
                attemptInitialResume();
            }, RESUME_RETRY_MS);
        };

        const setResumeStateStatus = (status: AudioResumeStatus) => {
            if (resumeStateRef.current) {
                resumeStateRef.current.status = status;
            }
            setResumeStatus(status);
        };

        const playIfRequestedAfterResume = () => {
            if (!playAfterResumeRef.current) return;

            playAfterResumeRef.current = false;
            audio.play()
                .then(() => setIsPlaying(true))
                .catch(error => {
                    console.error('Failed to play:', error);
                    setIsPlaying(false);
                });
        };

        const finishResume = (status: AudioResumeStatus) => {
            clearResumeRetry();
            setResumeStateStatus(status);

            if (status === 'applied' || status === 'skipped') {
                playIfRequestedAfterResume();
            } else if (status === 'failed') {
                playAfterResumeRef.current = false;
            }
        };

        const normalizedInitialTime = Number.isFinite(initialTime) ? Math.max(0, initialTime) : 0;
        const resumeKey = `${currentTrack}:${normalizedInitialTime}`;

        if (normalizedInitialTime > 0) {
            resumeStateRef.current = {
                key: resumeKey,
                targetTime: normalizedInitialTime,
                attempts: 0,
                stableChecks: 0,
                status: 'pending',
            };
            setResumeStatus('pending');
        } else {
            resumeStateRef.current = null;
            playAfterResumeRef.current = false;
            setResumeStatus('skipped');
        }

        const attemptInitialResume = (): AudioResumeStatus => {
            if (normalizedInitialTime <= 0) {
                finishResume('skipped');
                return 'skipped';
            }

            const resumeState = resumeStateRef.current;
            if (!resumeState || resumeState.key !== resumeKey) return 'idle';
            if (resumeState.status !== 'pending') return resumeState.status;

            const maxTime = Number.isFinite(audio.duration) && audio.duration > 0
                ? Math.max(0, audio.duration - 0.5)
                : resumeState.targetTime;
            const targetTime = Math.min(resumeState.targetTime, maxTime);

            try {
                audio.currentTime = targetTime;
            } catch {
                resumeState.stableChecks = 0;
                resumeState.attempts += 1;
                if (resumeState.attempts >= RESUME_MAX_ATTEMPTS) {
                    finishResume('failed');
                    return 'failed';
                }
                scheduleResumeRetry();
                return 'pending';
            }

            setCurrentTime(audio.currentTime);

            const isNearTarget = Math.abs(audio.currentTime - targetTime) <= RESUME_TOLERANCE_SECONDS;
            const hasMetadata = audio.readyState >= HTMLMediaElement.HAVE_METADATA;

            if (isNearTarget && hasMetadata) {
                resumeState.stableChecks += 1;
            } else {
                resumeState.stableChecks = 0;
            }

            if (resumeState.stableChecks >= 1 || (isNearTarget && resumeState.attempts >= 8)) {
                finishResume('applied');
                return 'applied';
            }

            resumeState.attempts += 1;
            if (resumeState.attempts < RESUME_MAX_ATTEMPTS) {
                scheduleResumeRetry();
                return 'pending';
            }

            finishResume('failed');
            return 'failed';
        };

        attemptResumeNowRef.current = attemptInitialResume;

        const setAudioData = () => {
            setDuration(audio.duration);
            attemptInitialResume();
            setCurrentTime(audio.currentTime);
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            onTrackEndRef.current();
        };

        // Events
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('durationchange', setAudioData);
        audio.addEventListener('canplay', setAudioData);
        audio.addEventListener('seeked', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        if (audio.readyState >= 1) {
            setAudioData();
        } else {
            attemptInitialResume();
        }

        return () => {
            clearResumeRetry();
            if (attemptResumeNowRef.current === attemptInitialResume) {
                attemptResumeNowRef.current = null;
            }
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('durationchange', setAudioData);
            audio.removeEventListener('canplay', setAudioData);
            audio.removeEventListener('seeked', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentTrack, initialTime]);

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

        if (isPlaying) {
            playAfterResumeRef.current = false;
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        if (resumeState?.status === 'pending') {
            playAfterResumeRef.current = true;
            const nextStatus = attemptResumeNowRef.current?.() ?? resumeState.status;
            if (nextStatus === 'pending') return;
            if (nextStatus === 'failed') {
                playAfterResumeRef.current = false;
                return;
            }
            return;
        }

        audioRef.current.play().catch(error => {
            console.error('Failed to play:', error);
            setIsPlaying(false);
        });
        setIsPlaying(true);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (resumeStateRef.current?.status === 'pending') {
            resumeStateRef.current.status = 'skipped';
            setResumeStatus('skipped');
        } else {
            setResumeStatus((previous) => previous === 'pending' ? 'skipped' : previous);
        }
        playAfterResumeRef.current = false;
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
        resumeStatus,
        handlePlayPause,
        handleSeek
    };
}
