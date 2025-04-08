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
}

const HTML5Player: React.FC<HTML5PlayerProps> = ({ tracks, autoPlay = false }) => {
    // const router = useRouter();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [currentTrack, setCurrentTrack] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [muted, setMuted] = useState<boolean>(false);
    // const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

    const toggleMute = (): void => setMuted(!muted);

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
        <div className="audio-player w-full relative">
            <audio ref={audioRef} muted={muted} preload="auto" autoPlay={autoPlay}>
                <source src={tracks[currentTrack].url} type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>

            <div className="time-controls relative">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex-1 text-start font-medium">{tracks[currentTrack].title}</div>
                    <div className="time-display flex-1 text-end font-light">{formatTime(currentTime)} / {formatTime(duration)}</div>
                </div>

                <div className="relative flex flex-row items-center">
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

                    <button
                        onClick={toggleMute}
                        className="ms-2 rounded-full hover:bg-opacity-20 hover:bg-gray-400 transition-colors duration-300 ease-in-out"
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                </div>

            </div>

            {/* <div className="player-controls">
                <button
                    onClick={handlePrev}
                    disabled={tracks.length <= 1}
                    className="control-button"
                >
                    Previous
                </button>
                <button onClick={handlePlayPause} className="control-button play-pause mx-4">
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                    onClick={handleNext}
                    disabled={tracks.length <= 1}
                    className="control-button"
                >
                    Next
                </button>
            </div> */}

            <div className="flex items-center justify-center">
                {/* <button
                    onClick={toggleMute}
                    className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-400 transition-colors duration-300 ease-in-out"
                    title={muted ? "Unmute" : "Mute"}
                >
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button> */}

                <div className="player-controls flex flex-row flex-1 items-center justify-center relative">

                    <button
                        onClick={handlePrev}
                        disabled={tracks.length <= 1}
                        className="control-button"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handlePlayPause}
                            className={`p-2 rounded-full ${isPlaying ? 'bg-cyan-600' : 'bg-cyan-500'} text-white transition-colors duration-300 ease-in-out`}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                        </button>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={tracks.length <= 1}
                        className="control-button"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>

                {/* <span className="text-xs">{playbackSpeed}x</span> */}
            </div>

            {
                showPlaylist && tracks.length > 1 && (
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
                )
            }
        </div >
    );
};

export default HTML5Player;