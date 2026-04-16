/**
 * Quill Dancing Scene — The quill mascot bounces fast,
 * sways its body, and alternates legs in a celebratory dance.
 *
 * Self-contained: all SVG, CSS keyframes, and animations are embedded.
 */
import { useEffect } from 'react';
import { QuillBody, QuillLegs, QuillEyes, QuillInkTrail } from './quill-parts';
import {
    KEYFRAMES_DANCE_BOUNCE,
    KEYFRAMES_DANCE_SWAY,
    KEYFRAMES_DANCE_LEG_LEFT,
    KEYFRAMES_DANCE_LEG_RIGHT,
    REDUCED_MOTION,
} from './quill-styles';

/** Total duration: ~3s of dancing */
export const QUILL_DANCING_DURATION = 3000;

interface QuillDancingProps {
    className?: string;
    onComplete?: () => void;
}

export function QuillDancing({ className, onComplete }: QuillDancingProps) {
    useEffect(() => {
        if (!onComplete) return;
        const timer = setTimeout(onComplete, QUILL_DANCING_DURATION);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const sceneStyles = `
        ${KEYFRAMES_DANCE_BOUNCE}
        ${KEYFRAMES_DANCE_SWAY}
        ${KEYFRAMES_DANCE_LEG_LEFT}
        ${KEYFRAMES_DANCE_LEG_RIGHT}

        /* Fast vertical bounce */
        .quill-dance-bounce {
            animation: quillDanceBounce 0.6s ease-in-out infinite;
        }

        /* Body sway */
        .quill-dance-sway {
            transform-origin: 45px 50px;
            animation: quillDanceSway 0.8s ease-in-out infinite;
        }

        /* Fast leg alternation */
        .quill-dance-scene .quill-leg-left {
            transform-origin: 28px 82px;
            animation: quillDanceLegLeft 0.3s ease-in-out infinite;
        }
        .quill-dance-scene .quill-leg-right {
            transform-origin: 34px 80px;
            animation: quillDanceLegRight 0.3s ease-in-out 0.15s infinite;
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

                <g className="quill-dance-scene">
                    <g className="quill-dance-bounce">
                        <g className="quill-dance-sway">
                            <QuillBody />
                            <QuillEyes />
                        </g>
                        <QuillLegs />
                    </g>
                    <QuillInkTrail />
                </g>
            </svg>
        </div>
    );
}
