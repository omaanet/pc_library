/**
 * Quill Writing Scene — The quill mascot dips rhythmically
 * as if writing, with the ink trail pulsing beneath.
 *
 * Self-contained: all SVG, CSS keyframes, and animations are embedded.
 */
import { useEffect } from 'react';
import { QuillBody, QuillLegs, QuillEyes, QuillInkTrail } from './quill-parts';
import {
    KEYFRAMES_WRITE_DIP,
    KEYFRAMES_INK_PULSE,
    REDUCED_MOTION,
} from './quill-styles';

/** Total duration: two full writing cycles ~4s */
export const QUILL_WRITING_DURATION = 4000;

interface QuillWritingProps {
    className?: string;
    onComplete?: () => void;
}

export function QuillWriting({ className, onComplete }: QuillWritingProps) {
    useEffect(() => {
        if (!onComplete) return;
        const timer = setTimeout(onComplete, QUILL_WRITING_DURATION);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const sceneStyles = `
        ${KEYFRAMES_WRITE_DIP}
        ${KEYFRAMES_INK_PULSE}

        /* Body dips rhythmically as if writing */
        .quill-write-dip {
            transform-origin: 30px 82px;
            animation: quillWriteDip 2s ease-in-out infinite;
        }

        /* Ink trail pulses while writing */
        .quill-write-ink {
            animation: quillInkPulse 1s ease-in-out infinite;
        }

        ${REDUCED_MOTION}
    `;

    return (
        <div className={className} aria-hidden="true">
            <svg
                viewBox="5 5 80 100"
                fill="none"
                stroke="currentColor"
                width="70"
                height="88"
                className="quill-scene"
            >
                <style>{sceneStyles}</style>

                <g className="quill-write-dip">
                    <QuillBody />
                    <QuillEyes />
                </g>
                <QuillLegs />
                <QuillInkTrail className="quill-write-ink" />
            </svg>
        </div>
    );
}
