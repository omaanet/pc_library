/**
 * Quill Walk-In Scene — The quill mascot walks in from the left,
 * bounces on arrival, then settles into a gentle idle animation.
 *
 * Self-contained: all SVG, CSS keyframes, and animations are embedded.
 * Import this component anywhere and it just works.
 */
import { useEffect } from 'react';
import { QuillBody, QuillLegs, QuillEyes, QuillInkTrail } from './quill-parts';
import {
    KEYFRAMES_WALK_IN,
    KEYFRAMES_BOUNCE,
    KEYFRAMES_FLOAT,
    KEYFRAMES_WOBBLE,
    KEYFRAMES_LEG_LEFT,
    KEYFRAMES_LEG_RIGHT,
    REDUCED_MOTION,
} from './quill-styles';

/** Total duration: walk-in (2s) + bounce (0.6s) = 2.6s */
export const QUILL_WALK_IN_DURATION = 2600;

interface QuillWalkInProps {
    className?: string;
    onComplete?: () => void;
}

export function QuillWalkIn({ className, onComplete }: QuillWalkInProps) {
    useEffect(() => {
        if (!onComplete) return;
        const timer = setTimeout(onComplete, QUILL_WALK_IN_DURATION);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const sceneStyles = `
        ${KEYFRAMES_WALK_IN}
        ${KEYFRAMES_BOUNCE}
        ${KEYFRAMES_FLOAT}
        ${KEYFRAMES_WOBBLE}
        ${KEYFRAMES_LEG_LEFT}
        ${KEYFRAMES_LEG_RIGHT}

        /* Phase 1: Walk-in slide */
        .quill-walk-in-scene {
            animation: quillWalkIn 2s ease-out forwards;
        }

        /* Phase 2: Arrival bounce (starts after walk-in) */
        .quill-bounce-wrap {
            transform-origin: 35px 90px;
            animation: quillBounce 0.6s ease-out 2s both;
        }

        /* Phase 3: Idle float (starts after walk-in + bounce) */
        .quill-float-wrap {
            animation: quillFloat 3s ease-in-out 2.6s infinite;
        }

        /* Phase 3: Idle wobble on the body */
        .quill-wobble-wrap {
            transform-origin: 45px 50px;
            animation: quillWobble 4s ease-in-out 2.6s infinite;
        }

        /* Legs walk during slide-in, then stop */
        .quill-leg-left {
            transform-origin: 28px 82px;
            animation: quillLegLeft 0.4s ease-in-out 0s 5;
        }
        .quill-leg-right {
            transform-origin: 34px 80px;
            animation: quillLegRight 0.4s ease-in-out 0.2s 5;
        }

        /* Ink trail fades in after arrival */
        .quill-ink-trail {
            opacity: 0;
            animation: quillInkFadeIn 0.8s ease-out 2.2s forwards;
        }

        @keyframes quillInkFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
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

                {/* Walk-in wrapper — slides the whole character from left */}
                <g className="quill-walk-in-scene">
                    {/* Bounce wrapper — squash/stretch on arrival */}
                    <g className="quill-bounce-wrap">
                        {/* Float wrapper — idle vertical bob */}
                        <g className="quill-float-wrap">
                            {/* Wobble wrapper — idle tilt */}
                            <g className="quill-wobble-wrap">
                                <QuillBody />
                                <QuillEyes />
                            </g>
                            <QuillLegs />
                            <QuillInkTrail className="quill-ink-trail" />
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    );
}
