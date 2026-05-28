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
    const lastAutoSavedSecondRef = useRef<number | null>(null);
    const latestMainAudioSecondRef = useRef<number | null>(null);
    const bookmarkWriteStateRef = useRef({
        canWrite: false,
        userId: undefined as number | undefined,
        saveBookmark,
    });

    useEffect(() => {
        if (!book || !book.hasAudio) return;

        const controller = new AbortController();

        setLoading(true);
        fetch(`/api/audiobooks/${book.id}`, { signal: controller.signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                setAudiobook(data && data.media_id ? data : null);
                setLoading(false);
            })
            .catch((error) => {
                // Ignore abort errors (component unmounted)
                if (error.name === 'AbortError') return;
                setAudiobook(null);
                setLoading(false);
            });

        // Cleanup function
        return () => {
            controller.abort();
        };
    }, [book]);

    useEffect(() => {
        if (!bookmarksInitialized) return;
        lastAutoSavedSecondRef.current = bookmarks.audio?.audioTimeSeconds ?? null;
    }, [bookmarks.audio?.audioTimeSeconds, bookmarksInitialized]);

    useEffect(() => {
        return () => {
            if (pendingAudioSaveRef.current !== null) {
                window.clearTimeout(pendingAudioSaveRef.current);
            }

            const latestSecond = latestMainAudioSecondRef.current;
            const { canWrite, userId, saveBookmark: saveLatestBookmark } = bookmarkWriteStateRef.current;
            if (!userId || !canWrite || latestSecond === null) return;

            void saveLatestBookmark({ kind: 'audio', audioTimeSeconds: latestSecond });
        };
    }, []);

    useEffect(() => {
        bookmarkWriteStateRef.current = {
            canWrite: bookmarksCanWrite,
            userId: authState.user?.id,
            saveBookmark,
        };
    }, [authState.user?.id, bookmarksCanWrite, saveBookmark]);

    const saveLatestAudioBookmark = useCallback(() => {
        const latestSecond = latestMainAudioSecondRef.current;
        if (!authState.user?.id || !bookmarksCanWrite || latestSecond === null) return;

        void saveBookmark({ kind: 'audio', audioTimeSeconds: latestSecond })
            .then((bookmark) => {
                if (bookmark) {
                    lastAutoSavedSecondRef.current = latestSecond;
                }
            })
            .catch((error) => {
                console.error('Failed to save audio bookmark on close:', error);
            });
    }, [authState.user?.id, bookmarksCanWrite, saveBookmark]);

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
    const introAudioId = audiobook?.intro_audio_id?.trim() ?? '';
    const introAudioTitle = audiobook?.intro_audio_title?.trim() || defaultIntroTitle;

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

    const tracks = book && audiobook?.media_id
        ? [
            ...(introTrack ? [introTrack] : []),
            {
                title: book.title || '',
                url: `${SITE_CONFIG.DEFAULT_CDN}/${audiobook.media_id}`,
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
        audiobook?.media_id &&
        (!audioBookmark.audioMediaId || audioBookmark.audioMediaId === audiobook.media_id)
    );
    const initialTrackIndex = canResumeAudio && introTrack ? 1 : 0;
    const initialTime = canResumeAudio ? Math.max(0, audioBookmark?.audioTimeSeconds ?? 0) : 0;

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
            if (Number.isFinite(latestSecond) && latestSecond >= 1) {
                latestMainAudioSecondRef.current = latestSecond;
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

        const lastSavedSecond = lastAutoSavedSecondRef.current;
        if (lastSavedSecond !== null && Math.abs(nextSecond - lastSavedSecond) < 10) return;

        if (pendingAudioSaveRef.current !== null) {
            window.clearTimeout(pendingAudioSaveRef.current);
        }

        pendingAudioSaveRef.current = window.setTimeout(() => {
            saveBookmark({ kind: 'audio', audioTimeSeconds: nextSecond })
                .then(() => {
                    lastAutoSavedSecondRef.current = nextSecond;
                })
                .catch((error) => {
                    console.error('Failed to auto-save audio bookmark:', error);
                })
                .finally(() => {
                    pendingAudioSaveRef.current = null;
                });
        }, 500);
    }, [authState.user?.id, bookmarksCanWrite, bookmarksError, isActive, saveBookmark]);

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

    if (loading) {
        return (
            <div className="w-full text-center p-0 rounded-md mt-2 mb-0">
                <Skeleton className="w-full rounded-md" style={{ minHeight: 120 }} />
            </div>
        );
    }
    if (!audiobook || !audiobook.media_id) return null;

    return (
        <div className="w-full text-center py-3 px-5 rounded-md mt-2 mb-0 mx-auto bg-muted/40">
            <HTML5Player
                tracks={tracks}
                autoPlay={autoPlay}
                initialTrackIndex={initialTrackIndex}
                initialTime={initialTime}
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
