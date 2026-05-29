"use client";

// src/components/audio/HTML5Player.tsx
// Main orchestrator component for audio player

import type { HTML5PlayerProps } from './types';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useVolumeControl } from './hooks/useVolumeControl';
import { useTrackNavigation } from './hooks/useTrackNavigation';
import { TrackInfo } from './components/TrackInfo';
import { TimeDisplay } from './components/TimeDisplay';
import { SeekBar } from './components/SeekBar';
import { VolumeControl } from './components/VolumeControl';
import { AudioControls } from './components/AudioControls';

function getAudioSourceType(url: string): string | undefined {
    const pathname = url.split('?')[0]?.toLowerCase() ?? '';

    if (pathname.endsWith('.mp3')) return 'audio/mpeg';
    if (pathname.endsWith('.mp4') || pathname.endsWith('.m4a')) return 'audio/mp4';

    return undefined;
}

const HTML5Player = ({
    tracks,
    autoPlay = false,
    initialVolume = 25,
    initialTrackIndex = 0,
    initialTime = 0,
    onProgress,
    onBookmark,
    isBookmarkActive,
    isBookmarkSaving = false,
    showBookmarkControl = false,
    isBookmarkDisabled = false
}: HTML5PlayerProps) => {
    // Track navigation
    const { currentTrack, handleNext, handlePrev, handleEnd } = useTrackNavigation({ tracks, initialTrackIndex });

    // Audio playback
    const {
        audioRef,
        isPlaying,
        currentTime,
        duration,
        handlePlayPause,
        handleSeek
    } = useAudioPlayer({
        autoPlay,
        currentTrack,
        initialTime: currentTrack === initialTrackIndex ? initialTime : 0,
        onTrackEnd: handleEnd
    });

    // Volume control
    const {
        volume,
        muted,
        showVolumeSlider,
        volumeSliderRef,
        volumeButtonRef,
        handleVolumeChange,
        handleVolumeButtonClick
    } = useVolumeControl({
        audioRef,
        initialVolume
    });

    const showPlaylist: boolean = false;
    const currentTrackData = tracks[currentTrack];
    const currentSourceType = currentTrackData ? getAudioSourceType(currentTrackData.url) : undefined;
    const currentState = useMemo(() => currentTrackData
        ? {
            currentTrack,
            track: currentTrackData,
            currentTime,
            duration,
            isPlaying,
        }
        : null,
    [currentTrack, currentTrackData, currentTime, duration, isPlaying]);
    const showBookmarkButton = Boolean((showBookmarkControl || onBookmark) && currentState?.track.kind === 'main');
    const canBookmark = Boolean(onBookmark) && !isBookmarkDisabled && currentState?.track.kind === 'main';
    const bookmarkActive = currentState ? (isBookmarkActive?.(currentState) ?? false) : false;

    useEffect(() => {
        if (currentState) {
            onProgress?.(currentState);
        }
    }, [currentState, onProgress]);

    if (!tracks || tracks.length === 0 || !currentState) {
        return <div>No tracks available</div>;
    }

    return (
        <div>
            <div className="audio-player w-full">
                <audio ref={audioRef} muted={muted || volume === 0} preload="auto">
                    <source
                        src={tracks[currentTrack].url}
                        {...(currentSourceType ? { type: currentSourceType } : {})}
                    />
                    Your browser does not support the audio element.
                </audio>

                <div className="time-controls">
                    <div className="flex flex-row items-center justify-between mb-1">
                        <TrackInfo track={tracks[currentTrack]} />
                        <TimeDisplay currentTime={currentTime} duration={duration} />
                    </div>

                    <div className="flex flex-row items-center">
                        <SeekBar
                            currentTime={currentTime}
                            duration={duration}
                            onSeek={handleSeek}
                        />

                        <VolumeControl
                            volume={volume}
                            muted={muted}
                            showVolumeSlider={showVolumeSlider}
                            volumeSliderRef={volumeSliderRef}
                            volumeButtonRef={volumeButtonRef}
                            onVolumeButtonClick={handleVolumeButtonClick}
                            onVolumeChange={handleVolumeChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-[auto_1fr_auto] items-center mt-1">
                    <div className="text-sm text-gray-400">
                        {currentTrack + 1}/{tracks.length}
                    </div>
                    <AudioControls
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayPause}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        disablePrev={tracks.length <= 1 || currentTrack <= 0}
                        disableNext={tracks.length <= 1 || currentTrack >= tracks.length - 1}
                    />
                    {showBookmarkButton ? (
                        <button
                            type="button"
                            className="justify-self-end rounded-full p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => {
                                if (canBookmark) {
                                    onBookmark?.(currentState);
                                }
                            }}
                            disabled={!canBookmark || isBookmarkSaving}
                            aria-label="Salva segnalibro audio"
                            title={currentState.track.kind === 'main' ? 'Salva segnalibro audio' : 'Disponibile sul racconto audio'}
                        >
                            {bookmarkActive ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                    ) : (
                        <div className="justify-self-end p-2 text-gray-400 invisible" aria-hidden="true">
                            {currentTrack + 1}/{tracks.length}
                        </div>
                    )}
                </div>

                {showPlaylist && tracks.length > 1 && (
                    <div className="playlist">
                        <h3>Playlist</h3>
                        <ul className="track-list">
                            {tracks.map((track, index) => (
                                <li
                                    key={index}
                                    className={`track-item ${index === currentTrack ? 'active' : ''}`}
                                    style={{
                                        cursor: "pointer",
                                        fontWeight: index === currentTrack ? "bold" : "normal"
                                    }}
                                    onClick={() => {
                                        // Note: setCurrentTrack would need to be exposed from useTrackNavigation
                                        // For now, this playlist feature is disabled (showPlaylist = false)
                                    }}
                                >
                                    {track.title}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HTML5Player;
