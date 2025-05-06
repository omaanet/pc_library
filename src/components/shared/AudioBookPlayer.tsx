import React, { useEffect, useState } from "react";
import HTML5Player from "@/components/HTML5Player";
import { Skeleton } from '@/components/ui/skeleton';
import { Book } from "@/types";

export interface AudioBookPlayerProps {
    book: Book | null;
    autoPlay?: boolean;
    playerKey?: string; // Optional: for React keying if needed
}

const AudioBookPlayer = ({ book, autoPlay = false }: AudioBookPlayerProps) => {
    const [audiobook, setAudiobook] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!book || !book.hasAudio) return;
        setLoading(true);
        fetch(`/api/audiobooks/${book.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                setAudiobook(data && data.media_id ? data : null);
                setLoading(false);
            })
            .catch(() => {
                setAudiobook(null);
                setLoading(false);
            });
    }, [book]);

    if (!book || !book.hasAudio) return null;

    if (loading) {
        return (
            <div className="w-full text-center py-3 px-5 rounded-md mt-2 mb-0 mx-auto">
                <Skeleton className="h-20 w-full max-w-xl mx-auto rounded-md" />
            </div>
        );
    }
    if (!audiobook || !audiobook.media_id) return null;

    const tracks = [
        {
            title: 'Nota per la beneficenza',
            url: 'https://s3.eu-south-1.wasabisys.com/piero-audiolibri/Nota per la beneficenza.mp3',
        },
        {
            title: book.title || '',
            url: `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/${audiobook.media_id}`
        },
    ];

    return (
        <div className="w-full text-center py-3 px-5 rounded-md mt-2 mb-0 mx-auto bg-muted/40">
            <HTML5Player tracks={tracks} autoPlay={autoPlay} />
        </div>
    );
};

export default AudioBookPlayer;
