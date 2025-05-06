"use client";

import React, { useState, useRef, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ArrowRight, Volume2, VolumeX, Play, Pause,
} from 'lucide-react';

// Define types
interface Track {
    title: string;
    url: string;
}

interface HTML5PlayerProps {
    tracks: Track[];
    autoPlay?: boolean;
    initialVolume?: number; // percent, 0-100
}

const HTML5Player = ({ tracks, autoPlay = false, initialVolume = 25 }: HTML5PlayerProps) => {
    // const router = useRouter();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [currentTrack, setCurrentTrack] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [muted, setMuted] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(typeof initialVolume === 'number' ? Math.max(0, Math.min(1, initialVolume / 100)) : 0.25); // 0..1
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
    }, [volume, muted]);

    // When dragging slider
    const handleVolumeChange = (val: number) => {
        setVolume(val);
        if (val === 0) {
            setMuted(true);
        } else {
            setMuted(false);
        }
    };


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
        audio.addEventListener('ended', handleEnd);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnd);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().catch(error => {
                    // console.error('Failed to play:', error);
                    setIsPlaying(false);
                });
            }
        }
    }, [currentTrack]);

    const formatTime = (time: number): string => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

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

    const handleEnd = (): void => {
        if (tracks.length <= 1) return;
        setCurrentTrack((currentTrack + 1) % tracks.length);
        setIsPlaying(true);
    };

    const handleNext = (): void => {
        if (tracks.length <= 1) return;
        setCurrentTrack((currentTrack + 1) % tracks.length);
        setIsPlaying(true);
    };

    const handlePrev = (): void => {
        if (tracks.length <= 1) return;
        setCurrentTrack((currentTrack - 1 + tracks.length) % tracks.length);
        setIsPlaying(true);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    // Early return if no tracks are provided
    if (!tracks || tracks.length === 0) {
        return <div>No tracks available</div>;
    }

    const showPlaylist: boolean = false;

    return (
        <div>
            <div className="audio-player w-full">
                <audio ref={audioRef} muted={muted || volume === 0} preload="auto" autoPlay={autoPlay}>
                    <source src={tracks[currentTrack].url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>

                <div className="time-controls">
                    <div className="flex flex-row items-center justify-between mb-1">
                        <div className="flex-1 text-start font-medium">{tracks[currentTrack].title}</div>
                        <div className="time-display flex-1 text-end font-light">{formatTime(currentTime)} / {formatTime(duration)}</div>
                    </div>

                    <div className="flex flex-row items-center">
                        <input
                            type="range"
                            className="seek-slider"
                            min="0"
                            max={duration || 0}
                            step="0.01"
                            value={currentTime}
                            onChange={handleSeek}
                            style={{ width: '100%' }}
                        />

                        <div className="relative ms-3">
                            <button
                                ref={volumeButtonRef}
                                onClick={handleVolumeButtonClick}
                                className="rounded-full align-middle my-1 hover:bg-opacity-20 hover:bg-gray-400 transition-colors duration-300 ease-in-out text-teal-500 hover:text-emerald-600 dark:text-teal-300 dark:hover:text-emerald-500"
                                title={muted || volume === 0 ? "Unmute" : "Mute/Volume"}
                                aria-label="Volume"
                            >
                                {(muted || volume === 0) ? <VolumeX size={21} /> : <Volume2 size={21} />}
                            </button>
                            {showVolumeSlider && (
                                <div
                                    ref={volumeSliderRef}
                                    className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center z-50 mt-2"
                                    style={{ minHeight: 60 }}
                                >
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={muted ? 0 : volume}
                                        onChange={e => handleVolumeChange(Number(e.target.value))}
                                        className="volume-slider"
                                        style={{
                                            /* writingMode: 'bt-lr', // vertical handled by CSS */
                                            WebkitAppearance: 'slider-vertical',
                                            height: 60,
                                        }}
                                    />
                                    <div className="text-xs mt-1 bg-gray-800 text-white rounded px-1 py-0.5 select-none" style={{ fontSize: '0.75rem' }}>{Math.round((muted ? 0 : volume) * 100)}%</div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                <div className="flex items-center justify-center mt-1">

                    <div className="player-controls flex flex-row flex-1 items-center justify-center relative">

                        <button
                            onClick={handlePrev}
                            disabled={tracks.length <= 1}
                            className="control-button hover:text-yellow-400"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div className="flex items-center">
                            <button
                                onClick={handlePlayPause}
                                className={`p-2 rounded-full mx-3 ${isPlaying ? 'bg-emerald-500 hover:bg-emerald-400 ' : 'bg-cyan-600 hover:bg-cyan-400'} text-white hover:text-black transition-colors duration-300 ease-in-out`}
                                title={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                            </button>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={tracks.length <= 1}
                            className="control-button hover:text-yellow-400"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>

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
                                        setCurrentTrack(index);
                                        setIsPlaying(true);
                                    }}
                                >
                                    {track.title}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <style jsx>{`
              .volume-slider {
                writing-mode: vertical-lr;
                width: 24px;
                height: 60px;
                accent-color: #10b981;
                margin: 0 4px;
                cursor: pointer;
                background: transparent;
              }
              .volume-slider::-webkit-slider-thumb {
                background: #10b981;
                border-radius: 50%;
                border: none;
              }
              .volume-slider::-moz-range-thumb {
                background: #10b981;
                border-radius: 50%;
                border: none;
              }
              .volume-slider::-ms-thumb {
                background: #10b981;
                border-radius: 50%;
                border: none;
              }
            `}</style>
        </div>
    );
};

export default HTML5Player;