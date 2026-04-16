/**
 * Quill Walk-Out Scene — The quill mascot walks to the right
 * and exits the scene.
 *
 * Self-contained: all SVG, CSS keyframes, and animations are embedded.
 */
import { useEffect } from 'react';
import { QuillBody, QuillLegs, QuillEyes, QuillInkTrail } from './quill-parts';
import {
    KEYFRAMES_WALK_OUT,
    KEYFRAMES_LEG_LEFT,
    KEYFRAMES_LEG_RIGHT,
    REDUCED_MOTION,
} from './quill-styles';

/** Total duration: walk-out slide ~2s */
export const QUILL_WALK_OUT_DURATION = 2000;

interface QuillWalkOutProps {
    className?: string;
    onComplete?: () => void;
}

export function QuillWalkOut({ className, onComplete }: QuillWalkOutProps) {
    useEffect(() => {
        if (!onComplete) return;
        const timer = setTimeout(onComplete, QUILL_WALK_OUT_DURATION);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const sceneStyles = `
        ${KEYFRAMES_WALK_OUT}
        ${KEYFRAMES_LEG_LEFT}
        ${KEYFRAMES_LEG_RIGHT}

        /* Slide the whole character to the right */
        .quill-walk-out-scene {
            animation: quillWalkOut 2s ease-in forwards;
        }

        /* Legs walk during slide-out */
        .quill-walk-out-scene .quill-leg-left {
            transform-origin: 28px 82px;
            animation: quillLegLeft 0.4s ease-in-out 0s 5;
        }
        .quill-walk-out-scene .quill-leg-right {
            transform-origin: 34px 80px;
            animation: quillLegRight 0.4s ease-in-out 0.2s 5;
        }

        ${REDUCED_MOTION}
    `;

    return (
        <div className={className} style={{ overflow: 'hidden' }} aria-hidden="true">
            <svg
                viewBox="5 5 80 100"
                fill="none"
                stroke="currentColor"
                width="70"
                height="88"
                className="quill-scene"
            >
                <style>{sceneStyles}</style>

                <g className="quill-walk-out-scene">
                    <QuillBody />
                    <QuillEyes />
                    <QuillLegs />
                    <QuillInkTrail />
                </g>
            </svg>
        </div>
    );
}
