"use client";

// src/components/audio/HTML5Player.tsx
// Main orchestrator component for audio player

import type { HTML5PlayerProps } from './types';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useVolumeControl } from './hooks/useVolumeControl';
import { useTrackNavigation } from './hooks/useTrackNavigation';
import { TrackInfo } from './components/TrackInfo';
import { TimeDisplay } from './components/TimeDisplay';
import { SeekBar } from './components/SeekBar';
import { VolumeControl } from './components/VolumeControl';
import { AudioControls } from './components/AudioControls';

const HTML5Player = ({ tracks, autoPlay = false, initialVolume = 25 }: HTML5PlayerProps) => {
    // Track navigation
    const { currentTrack, handleNext, handlePrev, handleEnd } = useTrackNavigation({ tracks });

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

    // Early return if no tracks are provided
    if (!tracks || tracks.length === 0) {
        return <div>No tracks available</div>;
    }

    const showPlaylist: boolean = false;

    return (
        <div>
            <div className="audio-player w-full">
                <audio ref={audioRef} muted={muted || volume === 0} preload="auto">
                    <source src={tracks[currentTrack].url} type="audio/mpeg" />
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

                <div className="flex items-center justify-center mt-1">
                    <AudioControls
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayPause}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        disableNavigation={tracks.length <= 1}
                    />
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
