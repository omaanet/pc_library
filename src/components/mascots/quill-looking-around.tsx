/**
 * Quill Looking-Around Scene — The quill mascot stands still
 * and curiously looks left and right with a gentle head tilt.
 *
 * Self-contained: all SVG, CSS keyframes, and animations are embedded.
 */
import { useEffect } from 'react';
import { QuillBody, QuillLegs, QuillEyes, QuillInkTrail } from './quill-parts';
import {
    KEYFRAMES_FLOAT,
    KEYFRAMES_LOOK_AROUND,
    KEYFRAMES_HEAD_TILT,
    REDUCED_MOTION,
} from './quill-styles';

/** Total duration: one full look-around cycle ~3s */
export const QUILL_LOOKING_AROUND_DURATION = 3000;

interface QuillLookingAroundProps {
    className?: string;
    onComplete?: () => void;
}

export function QuillLookingAround({ className, onComplete }: QuillLookingAroundProps) {
    useEffect(() => {
        if (!onComplete) return;
        const timer = setTimeout(onComplete, QUILL_LOOKING_AROUND_DURATION);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const sceneStyles = `
        ${KEYFRAMES_FLOAT}
        ${KEYFRAMES_LOOK_AROUND}
        ${KEYFRAMES_HEAD_TILT}

        /* Gentle idle float */
        .quill-look-float {
            animation: quillFloat 3s ease-in-out infinite;
        }

        /* Head tilts curiously */
        .quill-look-tilt {
            transform-origin: 45px 50px;
            animation: quillHeadTilt 3s ease-in-out infinite;
        }

        /* Eyes shift left and right */
        .quill-look-eyes {
            animation: quillLookAround 3s ease-in-out infinite;
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

                <g className="quill-look-float">
                    <g className="quill-look-tilt">
                        <QuillBody />
                        <QuillEyes className="quill-look-eyes" />
                    </g>
                    <QuillLegs />
                    <QuillInkTrail />
                </g>
            </svg>
        </div>
    );
}
