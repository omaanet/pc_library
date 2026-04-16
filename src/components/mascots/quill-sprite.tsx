/**
 * QuillSprite — Pose-aware SVG mascot for the free-roaming system.
 *
 * Renders the Quill character with configurable pose, facing direction,
 * scale, and opacity. Each pose applies its own CSS keyframes to the
 * internal SVG parts. The SVG uses overflow:visible so the character
 * is never clipped.
 */
import { QuillBody, QuillLegs, QuillEyes, QuillInkTrail } from './quill-parts';
import type { QuillPose, QuillFacing } from './quill-actions';
import { getSpriteWidth } from './quill-actions';
import {
    KEYFRAMES_FLOAT,
    KEYFRAMES_WOBBLE,
    KEYFRAMES_LEG_LEFT,
    KEYFRAMES_LEG_RIGHT,
    KEYFRAMES_LOOK_AROUND,
    KEYFRAMES_HEAD_TILT,
    KEYFRAMES_WRITE_DIP,
    KEYFRAMES_INK_PULSE,
    KEYFRAMES_DANCE_BOUNCE,
    KEYFRAMES_DANCE_SWAY,
    KEYFRAMES_DANCE_LEG_LEFT,
    KEYFRAMES_DANCE_LEG_RIGHT,
    KEYFRAMES_NOD,
    REDUCED_MOTION,
} from './quill-styles';

interface QuillSpriteProps {
    pose: QuillPose;
    facing: QuillFacing;
    scale?: number;
    opacity?: number;
}

/** All keyframes injected once; poses activate via CSS classes */
const ALL_KEYFRAMES = `
    ${KEYFRAMES_FLOAT}
    ${KEYFRAMES_WOBBLE}
    ${KEYFRAMES_LEG_LEFT}
    ${KEYFRAMES_LEG_RIGHT}
    ${KEYFRAMES_LOOK_AROUND}
    ${KEYFRAMES_HEAD_TILT}
    ${KEYFRAMES_WRITE_DIP}
    ${KEYFRAMES_INK_PULSE}
    ${KEYFRAMES_DANCE_BOUNCE}
    ${KEYFRAMES_DANCE_SWAY}
    ${KEYFRAMES_DANCE_LEG_LEFT}
    ${KEYFRAMES_DANCE_LEG_RIGHT}
    ${KEYFRAMES_NOD}
`;

const POSE_STYLES = `
    /* ── Idle ── */
    .qp-idle .qp-body-wrap {
        animation: quillFloat 3s ease-in-out infinite;
    }
    .qp-idle .qp-tilt {
        transform-origin: 45px 50px;
        animation: quillWobble 4s ease-in-out infinite;
    }

    /* ── Walking ── */
    .qp-walking .quill-leg-left {
        transform-origin: 28px 82px;
        animation: quillLegLeft 0.4s ease-in-out infinite;
    }
    .qp-walking .quill-leg-right {
        transform-origin: 34px 80px;
        animation: quillLegRight 0.4s ease-in-out 0.2s infinite;
    }
    .qp-walking .qp-body-wrap {
        animation: quillFloat 1.5s ease-in-out infinite;
    }

    /* ── Looking ── */
    .qp-looking .qp-body-wrap {
        animation: quillFloat 3s ease-in-out infinite;
    }
    .qp-looking .qp-tilt {
        transform-origin: 45px 50px;
        animation: quillHeadTilt 3s ease-in-out infinite;
    }
    .qp-looking .qp-eyes {
        animation: quillLookAround 3s ease-in-out infinite;
    }

    /* ── Nodding ── */
    .qp-nodding .qp-tilt {
        transform-origin: 55px 35px;
        animation: quillNod 0.4s ease-in-out infinite;
    }

    /* ── Dancing ── */
    .qp-dancing .qp-body-wrap {
        animation: quillDanceBounce 0.6s ease-in-out infinite;
    }
    .qp-dancing .qp-tilt {
        transform-origin: 45px 50px;
        animation: quillDanceSway 0.8s ease-in-out infinite;
    }
    .qp-dancing .quill-leg-left {
        transform-origin: 28px 82px;
        animation: quillDanceLegLeft 0.3s ease-in-out infinite;
    }
    .qp-dancing .quill-leg-right {
        transform-origin: 34px 80px;
        animation: quillDanceLegRight 0.3s ease-in-out 0.15s infinite;
    }

    /* ── Writing ── */
    .qp-writing .qp-tilt {
        transform-origin: 30px 82px;
        animation: quillWriteDip 2s ease-in-out infinite;
    }
    .qp-writing .qp-ink {
        animation: quillInkPulse 1s ease-in-out infinite;
    }

    ${REDUCED_MOTION}
`;

export function QuillSprite({ pose, facing, scale = 1, opacity = 1 }: QuillSpriteProps) {
    const w = getSpriteWidth();
    const h = w * (88 / 70); // maintain aspect ratio
    const showInk = pose === 'idle' || pose === 'writing';

    return (
        <svg
            viewBox="5 5 80 100"
            fill="none"
            stroke="currentColor"
            width={w}
            height={h}
            style={{
                overflow: 'visible',
                transform: `scaleX(${facing === 'left' ? -1 : 1}) scale(${scale})`,
                opacity,
                transition: 'transform 0.2s ease, opacity 0.3s ease',
            }}
            className={`quill-scene qp-${pose}`}
            aria-hidden="true"
        >
            <style>{ALL_KEYFRAMES}{POSE_STYLES}</style>

            <g className="qp-body-wrap">
                <g className="qp-tilt">
                    <QuillBody />
                    <QuillEyes className="qp-eyes" />
                </g>
                <QuillLegs />
                {showInk && <QuillInkTrail className="qp-ink" />}
            </g>
        </svg>
    );
}
