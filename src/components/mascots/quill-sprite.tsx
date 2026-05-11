/**
 * QuillSprite — Pose-aware SVG mascot for the free-roaming system.
 *
 * Renders the Quill character with configurable pose, facing direction,
 * scale, and opacity. Each pose applies its own CSS keyframes to the
 * internal SVG parts. The SVG uses overflow:visible so the character
 * is never clipped.
 *
 * Transport controls (used by /animations-manager):
 *  - `paused` toggles `animation-play-state: paused` for all internal animations
 *  - `reversed` flips `animation-direction: reverse` for all internal animations
 *  - `speedScale` multiplies every animation-duration (1 = real-time,
 *     2 = half speed, 0.5 = double speed)
 *
 * Pose changes crossfade over ~120ms so transitions don't snap.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { QuillBody, QuillLegs, QuillEyes, QuillInkTrail } from './quill-parts';
import type { QuillPose, QuillFacing } from './quill-actions';
import { getSpriteWidth } from './quill-actions';
import {
    KEYFRAMES_FLOAT,
    KEYFRAMES_WOBBLE,
    KEYFRAMES_BLINK,
    KEYFRAMES_BARB_SWAY,
    KEYFRAMES_WALK_LEG_FRONT,
    KEYFRAMES_WALK_LEG_BACK,
    KEYFRAMES_WALK_BOB,
    KEYFRAMES_WALK_LEAN,
    KEYFRAMES_RUN_LEG_FRONT,
    KEYFRAMES_RUN_LEG_BACK,
    KEYFRAMES_RUN_BOB,
    KEYFRAMES_RUN_LEAN,
    KEYFRAMES_LOOK_AROUND,
    KEYFRAMES_HEAD_TILT,
    KEYFRAMES_WRITE_DIP,
    KEYFRAMES_INK_PULSE,
    KEYFRAMES_DANCE_BOUNCE,
    KEYFRAMES_DANCE_SWAY,
    KEYFRAMES_DANCE_LEG_LEFT,
    KEYFRAMES_DANCE_LEG_RIGHT,
    KEYFRAMES_NOD,
    KEYFRAMES_JUMP_BODY,
    KEYFRAMES_JUMP_LEG_TUCK,
    KEYFRAMES_CLIMB_LEG_FRONT,
    KEYFRAMES_CLIMB_LEG_BACK,
    KEYFRAMES_CLIMB_SWAY,
    KEYFRAMES_CLIMB_BOB,
    KEYFRAMES_CROSSFADE_OUT,
    KEYFRAMES_CROSSFADE_IN,
    REDUCED_MOTION,
} from './quill-styles';

/** Duration of the pose crossfade in milliseconds */
const POSE_CROSSFADE_MS = 120;

interface QuillSpriteProps {
    pose: QuillPose;
    facing: QuillFacing;
    scale?: number;
    opacity?: number;
    /** Pause all internal CSS animations (used by manager transport bar) */
    paused?: boolean;
    /** Reverse all internal CSS animations */
    reversed?: boolean;
    /**
     * Multiplier on every animation-duration. 1 = real-time, 2 = half speed,
     * 0.5 = double speed. Implemented via the `--qdur-scale` CSS variable.
     */
    speedScale?: number;
}

/** All keyframes injected once; poses activate via CSS classes */
const ALL_KEYFRAMES = `
    ${KEYFRAMES_FLOAT}
    ${KEYFRAMES_WOBBLE}
    ${KEYFRAMES_BLINK}
    ${KEYFRAMES_BARB_SWAY}
    ${KEYFRAMES_WALK_LEG_FRONT}
    ${KEYFRAMES_WALK_LEG_BACK}
    ${KEYFRAMES_WALK_BOB}
    ${KEYFRAMES_WALK_LEAN}
    ${KEYFRAMES_RUN_LEG_FRONT}
    ${KEYFRAMES_RUN_LEG_BACK}
    ${KEYFRAMES_RUN_BOB}
    ${KEYFRAMES_RUN_LEAN}
    ${KEYFRAMES_LOOK_AROUND}
    ${KEYFRAMES_HEAD_TILT}
    ${KEYFRAMES_WRITE_DIP}
    ${KEYFRAMES_INK_PULSE}
    ${KEYFRAMES_DANCE_BOUNCE}
    ${KEYFRAMES_DANCE_SWAY}
    ${KEYFRAMES_DANCE_LEG_LEFT}
    ${KEYFRAMES_DANCE_LEG_RIGHT}
    ${KEYFRAMES_NOD}
    ${KEYFRAMES_JUMP_BODY}
    ${KEYFRAMES_JUMP_LEG_TUCK}
    ${KEYFRAMES_CLIMB_LEG_FRONT}
    ${KEYFRAMES_CLIMB_LEG_BACK}
    ${KEYFRAMES_CLIMB_SWAY}
    ${KEYFRAMES_CLIMB_BOB}
    ${KEYFRAMES_CROSSFADE_OUT}
    ${KEYFRAMES_CROSSFADE_IN}
`;

/**
 * Pose-specific animation rules.
 *
 * Every duration is multiplied by `var(--qdur-scale, 1)` so the manager's
 * speed slider can scale all animations uniformly.
 *
 * The leg DOM nodes are named `quill-leg-left` / `quill-leg-right` for
 * historical reasons; semantically `left` (x=28) is the BACK leg and
 * `right` (x=34) is the FRONT leg relative to the natural facing-right
 * orientation. The mapping flips automatically when facing left because
 * the whole SVG is mirrored via scaleX(-1).
 */
const POSE_STYLES = `
    /* Speed scaling default — overridable per instance via --qdur-scale */
    .quill-scene { --qdur-scale: 1; }

    /* ── Idle ── gentle float + wobble + occasional blink + barb sway */
    .qp-idle .qp-body-wrap {
        animation: quillFloat calc(3s * var(--qdur-scale)) ease-in-out infinite;
    }
    /* Spine bends FROM the pelvis (32,82) so the pelvis stays connected
       to the legs and the trunk reads as an organically curving line. */
    .qp-idle .qp-tilt {
        transform-origin: 32px 82px;
        animation: quillWobble calc(4s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-idle .qp-blink {
        transform-origin: 62px 27px;
        animation: quillBlink calc(5s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-idle .qp-barbs {
        transform-origin: 60px 35px;
        animation: quillBarbSway calc(4s * var(--qdur-scale)) ease-in-out infinite;
    }

    /* ── Walking ── coupled gait, body bob, forward lean */
    .qp-walking .quill-leg-left {
        transform-origin: 28px 82px;
        animation: quillWalkLegBack calc(0.5s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-walking .quill-leg-right {
        transform-origin: 34px 80px;
        animation: quillWalkLegFront calc(0.5s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-walking .qp-body-wrap {
        animation: quillWalkBob calc(0.5s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-walking .qp-tilt {
        transform-origin: 35px 82px;
        animation: quillWalkLean calc(0.5s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-walking .qp-blink {
        transform-origin: 62px 27px;
        animation: quillBlink calc(5s * var(--qdur-scale)) ease-in-out infinite;
    }

    /* ── Running ── faster cycle, larger stride, deeper bob, strong lean */
    .qp-running .quill-leg-left {
        transform-origin: 28px 82px;
        animation: quillRunLegBack calc(0.26s * var(--qdur-scale)) linear infinite;
    }
    .qp-running .quill-leg-right {
        transform-origin: 34px 80px;
        animation: quillRunLegFront calc(0.26s * var(--qdur-scale)) linear infinite;
    }
    .qp-running .qp-body-wrap {
        animation: quillRunBob calc(0.26s * var(--qdur-scale)) linear infinite;
    }
    .qp-running .qp-tilt {
        transform-origin: 35px 82px;
        animation: quillRunLean calc(0.26s * var(--qdur-scale)) linear infinite;
    }

    /* ── Looking ── slow float, curious head tilt, eyes shift */
    .qp-looking .qp-body-wrap {
        animation: quillFloat calc(3s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-looking .qp-tilt {
        transform-origin: 32px 82px;
        animation: quillHeadTilt calc(3s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-looking .qp-eyes {
        animation: quillLookAround calc(3s * var(--qdur-scale)) ease-in-out infinite;
    }

    /* ── Nodding ── */
    /* Nodding bends the spine from the pelvis — the head dips while the
       pelvis stays anchored to the legs. */
    .qp-nodding .qp-tilt {
        transform-origin: 32px 82px;
        animation: quillNod calc(0.4s * var(--qdur-scale)) ease-in-out infinite;
    }

    /* ── Dancing ── */
    .qp-dancing .qp-body-wrap {
        animation: quillDanceBounce calc(0.6s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-dancing .qp-tilt {
        transform-origin: 32px 82px;
        animation: quillDanceSway calc(0.8s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-dancing .quill-leg-left {
        transform-origin: 28px 82px;
        animation: quillDanceLegLeft calc(0.3s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-dancing .quill-leg-right {
        transform-origin: 34px 80px;
        animation: quillDanceLegRight calc(0.3s * var(--qdur-scale)) ease-in-out calc(0.15s * var(--qdur-scale)) infinite;
    }

    /* ── Writing ── */
    .qp-writing .qp-tilt {
        transform-origin: 30px 82px;
        animation: quillWriteDip calc(2s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-writing .qp-ink {
        animation: quillInkPulse calc(1s * var(--qdur-scale)) ease-in-out infinite;
    }

    /* ── Jumping ── anticipation crouch → launch → apex → landing squash */
    .qp-jumping .qp-body-wrap {
        transform-origin: 35px 90px;
        animation: quillJumpBody calc(0.9s * var(--qdur-scale)) ease-out infinite;
    }
    .qp-jumping .quill-leg-left {
        transform-origin: 28px 82px;
        animation: quillJumpLegTuck calc(0.9s * var(--qdur-scale)) ease-out infinite;
    }
    .qp-jumping .quill-leg-right {
        transform-origin: 34px 80px;
        animation: quillJumpLegTuck calc(0.9s * var(--qdur-scale)) ease-out infinite;
    }

    /* ── Climbing ── upright trunk, ladder-like leg reach, gentle body sway */
    .qp-climbing .quill-leg-left {
        transform-origin: 28px 82px;
        animation: quillClimbLegBack calc(0.7s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-climbing .quill-leg-right {
        transform-origin: 34px 80px;
        animation: quillClimbLegFront calc(0.7s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-climbing .qp-body-wrap {
        animation: quillClimbBob calc(0.7s * var(--qdur-scale)) ease-in-out infinite;
    }
    .qp-climbing .qp-tilt {
        transform-origin: 32px 82px;
        animation: quillClimbSway calc(1.4s * var(--qdur-scale)) ease-in-out infinite;
    }

    /* ── Pose crossfade overlay ── */
    .qp-crossfade-out {
        animation: quillCrossfadeOut ${POSE_CROSSFADE_MS}ms ease-out forwards;
    }
    .qp-crossfade-in {
        animation: quillCrossfadeIn ${POSE_CROSSFADE_MS}ms ease-out forwards;
    }

    /* ── Transport modifiers ── pause / reverse all internal animations */
    .qp-paused, .qp-paused * {
        animation-play-state: paused !important;
    }
    .qp-reverse .qp-body-wrap,
    .qp-reverse .qp-tilt,
    .qp-reverse .qp-eyes,
    .qp-reverse .qp-blink,
    .qp-reverse .qp-barbs,
    .qp-reverse .qp-ink,
    .qp-reverse .quill-leg-left,
    .qp-reverse .quill-leg-right {
        animation-direction: reverse !important;
    }

    ${REDUCED_MOTION}
`;

export function QuillSprite({
    pose,
    facing,
    scale = 1,
    opacity = 1,
    paused = false,
    reversed = false,
    speedScale = 1,
}: QuillSpriteProps) {
    const w = getSpriteWidth();
    const h = w * (88 / 70); // maintain aspect ratio
    const showInk = pose === 'idle' || pose === 'writing';

    // Track the previous pose so we can run a brief crossfade overlay
    // whenever the active pose changes.
    const prevPoseRef = useRef<QuillPose>(pose);
    const [crossfadeFrom, setCrossfadeFrom] = useState<QuillPose | null>(null);

    useEffect(() => {
        if (prevPoseRef.current === pose) return;
        const from = prevPoseRef.current;
        prevPoseRef.current = pose;
        setCrossfadeFrom(from);
        const t = window.setTimeout(() => setCrossfadeFrom(null), POSE_CROSSFADE_MS);
        return () => window.clearTimeout(t);
    }, [pose]);

    const showCrossfade = crossfadeFrom !== null && crossfadeFrom !== pose;
    const rootClass = [
        'quill-scene',
        `qp-${pose}`,
        paused ? 'qp-paused' : '',
        reversed ? 'qp-reverse' : '',
        showCrossfade ? 'qp-crossfade-in' : '',
    ].filter(Boolean).join(' ');

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
                ['--qdur-scale' as never]: String(speedScale),
            }}
            className={rootClass}
            aria-hidden="true"
        >
            <style>{ALL_KEYFRAMES}{POSE_STYLES}</style>

            {/* Outgoing pose layer — fades out for POSE_CROSSFADE_MS */}
            {showCrossfade && (
                <g className={`qp-${crossfadeFrom} qp-crossfade-out`}>
                    <g className="qp-body-wrap">
                        <g className="qp-tilt">
                            <QuillBody />
                            <QuillEyes className="qp-eyes" />
                        </g>
                        <QuillLegs />
                        {(crossfadeFrom === 'idle' || crossfadeFrom === 'writing') && (
                            <QuillInkTrail className="qp-ink" />
                        )}
                    </g>
                </g>
            )}

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
