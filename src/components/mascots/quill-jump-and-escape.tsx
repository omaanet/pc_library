/**
 * Quill Jump-and-Escape Scene — The quill mascot crouches,
 * jumps up, then zooms off to the right.
 *
 * Self-contained: all SVG, CSS keyframes, and animations are embedded.
 */
import { useEffect } from 'react';
import { QuillBody, QuillLegs, QuillEyes, QuillInkTrail } from './quill-parts';
import {
    KEYFRAMES_JUMP_UP,
    KEYFRAMES_ZOOM_OFF,
    REDUCED_MOTION,
} from './quill-styles';

/** Total duration: jump (0.8s) + zoom (0.6s) = ~1.4s, padded to 2s */
export const QUILL_JUMP_AND_ESCAPE_DURATION = 2000;

interface QuillJumpAndEscapeProps {
    className?: string;
    onComplete?: () => void;
}

export function QuillJumpAndEscape({ className, onComplete }: QuillJumpAndEscapeProps) {
    useEffect(() => {
        if (!onComplete) return;
        const timer = setTimeout(onComplete, QUILL_JUMP_AND_ESCAPE_DURATION);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const sceneStyles = `
        ${KEYFRAMES_JUMP_UP}
        ${KEYFRAMES_ZOOM_OFF}

        /* Phase 1: Crouch then jump up */
        .quill-jump-wrap {
            transform-origin: 35px 90px;
            animation: quillJumpUp 0.8s ease-out forwards;
        }

        /* Phase 2: Zoom off to the right after jump */
        .quill-escape-wrap {
            animation: quillZoomOff 0.6s ease-in 0.8s forwards;
        }

        /* Tuck legs during jump */
        .quill-jump-wrap .quill-leg-left,
        .quill-jump-wrap .quill-leg-right {
            animation: none;
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
                style={{ overflow: 'visible' }}
                className="quill-scene"
            >
                <style>{sceneStyles}</style>

                <g className="quill-escape-wrap">
                    <g className="quill-jump-wrap">
                        <QuillBody />
                        <QuillEyes />
                        <QuillLegs />
                    </g>
                </g>
                <QuillInkTrail />
            </svg>
        </div>
    );
}
