import { useCallback, useEffect, useRef, useState } from "react";
import HTML5Player from "@/components/audio/HTML5Player";
import { Skeleton } from '@/components/ui/skeleton';
import { Book, AudioBook } from "@/types";
import type { AudioPlayerState } from "@/components/audio/types";
import { useAuth } from '@/context/auth-context';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { SITE_CONFIG } from '@/config/site-config';

export interface AudioBookPlayerProps {
    book: Book | null;
    autoPlay?: boolean;
    isActive?: boolean;
    playerKey?: string; // Optional: for React keying if needed
}

const AudioBookPlayer = ({ book, autoPlay = false, isActive = true }: AudioBookPlayerProps) => {
    const [audiobook, setAudiobook] = useState<AudioBook | null>(null);
    const [audiobookBookId, setAudiobookBookId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSavingAudioBookmark, setIsSavingAudioBookmark] = useState(false);
    const { state: authState } = useAuth();
    const {
        bookmarks,
        initialized: bookmarksInitialized,
        error: bookmarksError,
        canWrite: bookmarksCanWrite,
        saveBookmark,
    } = useBookmarks(book?.id, Boolean(authState.user?.id));
    const pendingAudioSaveRef = useRef<number | null>(null);
    const lastAutoSavedSecondRef = useRef<{ key: string; second: number | null } | null>(null);
    const latestMainAudioSecondRef = useRef<{ key: string; second: number } | null>(null);
    const resumeTargetRef = useRef<{
        key: string;
        initialTrackIndex: number;
        initialTime: number;
    } | null>(null);
    const bookmarkWriteStateRef = useRef({
        canWrite: false,
        userId: undefined as number | undefined,
        playerKey: null as string | null,
        saveBookmark,
    });

    useEffect(() => {
        if (!book || !book.hasAudio) {
            setAudiobook(null);
            setAudiobookBookId(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        setLoading(true);
        setAudiobook(null);
        setAudiobookBookId(null);
        fetch(`/api/audiobooks/${book.id}`, { signal: controller.signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                setAudiobook(data && data.media_id ? data : null);
                setAudiobookBookId(book.id);
                setLoading(false);
            })
            .catch((error) => {
                // Ignore abort errors (component unmounted)
                if (error.name === 'AbortError') return;
                setAudiobook(null);
                setAudiobookBookId(book.id);
                setLoading(false);
            });

        // Cleanup function
        return () => {
            controller.abort();
        };
    }, [book]);

    const activeAudiobook = book && audiobookBookId === book.id ? audiobook : null;
    const playerKey = book && activeAudiobook?.media_id
        ? `${book.id}:${activeAudiobook.media_id}`
        : null;

    useEffect(() => {
        if (pendingAudioSaveRef.current !== null) {
            window.clearTimeout(pendingAudioSaveRef.current);
            pendingAudioSaveRef.current = null;
        }

        latestMainAudioSecondRef.current = null;
        lastAutoSavedSecondRef.current = null;
    }, [playerKey]);

    useEffect(() => {
        if (!bookmarksInitialized || !playerKey) return;
        lastAutoSavedSecondRef.current = {
            key: playerKey,
            second: bookmarks.audio?.audioTimeSeconds ?? null,
        };
    }, [bookmarks.audio?.audioTimeSeconds, bookmarksInitialized, playerKey]);

    useEffect(() => {
        return () => {
            if (pendingAudioSaveRef.current !== null) {
                window.clearTimeout(pendingAudioSaveRef.current);
            }

            const latest = latestMainAudioSecondRef.current;
            const { canWrite, userId, playerKey: latestPlayerKey, saveBookmark: saveLatestBookmark } = bookmarkWriteStateRef.current;
            if (!userId || !canWrite || !latest || latest.key !== latestPlayerKey) return;

            void saveLatestBookmark({ kind: 'audio', audioTimeSeconds: latest.second });
        };
    }, []);

    useEffect(() => {
        bookmarkWriteStateRef.current = {
            canWrite: bookmarksCanWrite,
            userId: authState.user?.id,
            playerKey,
            saveBookmark,
        };
    }, [authState.user?.id, bookmarksCanWrite, playerKey, saveBookmark]);

    const saveLatestAudioBookmark = useCallback(() => {
        const latest = latestMainAudioSecondRef.current;
        if (!authState.user?.id || !bookmarksCanWrite || !latest || latest.key !== playerKey) return;

        void saveBookmark({ kind: 'audio', audioTimeSeconds: latest.second })
            .then((bookmark) => {
                if (bookmark) {
                    lastAutoSavedSecondRef.current = {
                        key: latest.key,
                        second: latest.second,
                    };
                }
            })
            .catch((error) => {
                console.error('Failed to save audio bookmark on close:', error);
            });
    }, [authState.user?.id, bookmarksCanWrite, playerKey, saveBookmark]);

    useEffect(() => {
        if (isActive) return;

        if (pendingAudioSaveRef.current !== null) {
            window.clearTimeout(pendingAudioSaveRef.current);
            pendingAudioSaveRef.current = null;
        }

        saveLatestAudioBookmark();
    }, [isActive, saveLatestAudioBookmark]);

    const shouldIncludeDefaultIntroTrack = false;
    const defaultIntroTitle = 'Nota per la beneficenza';
    const introAudioId = activeAudiobook?.intro_audio_id?.trim() ?? '';
    const introAudioTitle = activeAudiobook?.intro_audio_title?.trim() || defaultIntroTitle;

    const introTrack = introAudioId
        ? {
            title: introAudioTitle,
            url: `${SITE_CONFIG.DEFAULT_CDN}/${introAudioId}`,
            kind: 'intro' as const
        }
        : shouldIncludeDefaultIntroTrack
            ? {
                title: defaultIntroTitle,
                url: `${SITE_CONFIG.DEFAULT_CDN}/Nota per la beneficenza.mp3`,
                kind: 'intro' as const
            }
            : null;

    const tracks = book && activeAudiobook?.media_id
        ? [
            ...(introTrack ? [introTrack] : []),
            {
                title: book.title || '',
                url: `${SITE_CONFIG.DEFAULT_CDN}/${activeAudiobook.media_id}`,
                kind: 'main' as const
            },
        ]
        : [];

    const audioBookmark = bookmarks.audio;
    const canResumeAudio = Boolean(
        bookmarksInitialized &&
        !bookmarksError &&
        audioBookmark?.audioTimeSeconds !== null &&
        audioBookmark?.audioTimeSeconds !== undefined &&
        activeAudiobook?.media_id &&
        (!audioBookmark.audioMediaId || audioBookmark.audioMediaId === activeAudiobook.media_id)
    );

    if (playerKey && bookmarksInitialized && resumeTargetRef.current?.key !== playerKey) {
        resumeTargetRef.current = {
            key: playerKey,
            initialTrackIndex: canResumeAudio && introTrack ? 1 : 0,
            initialTime: canResumeAudio ? Math.max(0, audioBookmark?.audioTimeSeconds ?? 0) : 0,
        };
    } else if (!playerKey) {
        resumeTargetRef.current = null;
    }

    const resumeTarget = resumeTargetRef.current?.key === playerKey
        ? resumeTargetRef.current
        : null;

    const saveAudioBookmark = useCallback(async (audioTimeSeconds: number) => {
        if (!authState.user?.id || !bookmarksCanWrite) return;

        setIsSavingAudioBookmark(true);
        try {
            await saveBookmark({
                kind: 'audio',
                audioTimeSeconds: Math.max(0, Math.floor(audioTimeSeconds)),
            });
        } catch (error) {
            console.error('Failed to save audio bookmark:', error);
        } finally {
            setIsSavingAudioBookmark(false);
        }
    }, [authState.user?.id, bookmarksCanWrite, saveBookmark]);

    const handleAudioProgress = useCallback((state: AudioPlayerState) => {
        if (state.track.kind === 'main') {
            const latestSecond = Math.floor(state.currentTime);
            if (playerKey && Number.isFinite(latestSecond) && latestSecond >= 1) {
                latestMainAudioSecondRef.current = {
                    key: playerKey,
                    second: latestSecond,
                };
            }
        }

        if (!isActive || !authState.user?.id || !bookmarksCanWrite || bookmarksError || state.track.kind !== 'main') return;
        if (!state.isPlaying) {
            if (pendingAudioSaveRef.current !== null) {
                window.clearTimeout(pendingAudioSaveRef.current);
                pendingAudioSaveRef.current = null;
            }
            return;
        }

        const nextSecond = Math.floor(state.currentTime);
        if (!Number.isFinite(nextSecond) || nextSecond < 1) return;

        const lastSavedSecond = lastAutoSavedSecondRef.current?.key === playerKey
            ? lastAutoSavedSecondRef.current.second
            : null;
        if (lastSavedSecond !== null && Math.abs(nextSecond - lastSavedSecond) < 10) return;

        if (pendingAudioSaveRef.current !== null) {
            window.clearTimeout(pendingAudioSaveRef.current);
        }

        const progressPlayerKey = playerKey;
        pendingAudioSaveRef.current = window.setTimeout(() => {
            saveBookmark({ kind: 'audio', audioTimeSeconds: nextSecond })
                .then(() => {
                    if (progressPlayerKey) {
                        lastAutoSavedSecondRef.current = {
                            key: progressPlayerKey,
                            second: nextSecond,
                        };
                    }
                })
                .catch((error) => {
                    console.error('Failed to auto-save audio bookmark:', error);
                })
                .finally(() => {
                    pendingAudioSaveRef.current = null;
                });
        }, 500);
    }, [authState.user?.id, bookmarksCanWrite, bookmarksError, isActive, playerKey, saveBookmark]);

    const handleManualAudioBookmark = useCallback((state: AudioPlayerState) => {
        if (state.track.kind !== 'main') return;
        void saveAudioBookmark(state.currentTime);
    }, [saveAudioBookmark]);

    const isAudioBookmarkActive = (state: AudioPlayerState) => {
        if (state.track.kind !== 'main' || audioBookmark?.audioTimeSeconds === null || audioBookmark?.audioTimeSeconds === undefined) {
            return false;
        }

        return Math.abs(Math.floor(state.currentTime) - audioBookmark.audioTimeSeconds) <= 1;
    };

    if (!book || !book.hasAudio) return null;

    if (loading || authState.isLoading || !bookmarksInitialized) {
        return (
            <div className="w-full text-center p-0 rounded-md mt-2 mb-0">
                <Skeleton className="w-full rounded-md" style={{ minHeight: 120 }} />
            </div>
        );
    }
    if (!activeAudiobook || !activeAudiobook.media_id || !playerKey || !resumeTarget) return null;

    return (
        <div className="w-full text-center py-3 px-5 rounded-md mt-2 mb-0 mx-auto bg-muted/40">
            <HTML5Player
                key={resumeTarget.key}
                tracks={tracks}
                autoPlay={autoPlay}
                initialTrackIndex={resumeTarget.initialTrackIndex}
                initialTime={resumeTarget.initialTime}
                onProgress={handleAudioProgress}
                onBookmark={authState.user?.id && isActive ? handleManualAudioBookmark : undefined}
                isBookmarkActive={isAudioBookmarkActive}
                isBookmarkSaving={isSavingAudioBookmark}
                showBookmarkControl={Boolean(authState.user?.id)}
                isBookmarkDisabled={!bookmarksCanWrite || !isActive}
            />
        </div>
    );
};

export default AudioBookPlayer;
