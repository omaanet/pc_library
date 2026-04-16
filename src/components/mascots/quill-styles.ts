/**
 * Shared CSS keyframe strings for Quill Mascot scenes.
 * Scenes import only the keyframes they need and inject them
 * into their own <style> tag inside the SVG.
 */

/** Gentle up/down floating idle */
export const KEYFRAMES_FLOAT = `
@keyframes quillFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}`;

/** Feather tilt wobble ±3° */
export const KEYFRAMES_WOBBLE = `
@keyframes quillWobble {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(3deg); }
    75% { transform: rotate(-3deg); }
}`;

/** Left leg walking swing */
export const KEYFRAMES_LEG_LEFT = `
@keyframes quillLegLeft {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(25deg); }
}`;

/** Right leg walking swing (opposite phase) */
export const KEYFRAMES_LEG_RIGHT = `
@keyframes quillLegRight {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-25deg); }
}`;

/** Walk-in slide from left */
export const KEYFRAMES_WALK_IN = `
@keyframes quillWalkIn {
    0% { transform: translateX(-150px); }
    100% { transform: translateX(0); }
}`;

/** Arrival bounce squash-and-stretch */
export const KEYFRAMES_BOUNCE = `
@keyframes quillBounce {
    0% { transform: scaleX(1) scaleY(1); }
    30% { transform: scaleX(1.15) scaleY(0.85); }
    50% { transform: scaleX(0.9) scaleY(1.1); }
    70% { transform: scaleX(1.05) scaleY(0.95); }
    100% { transform: scaleX(1) scaleY(1); }
}`;

/** Eye shift left/right for looking around */
export const KEYFRAMES_LOOK_AROUND = `
@keyframes quillLookAround {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-3px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-2px); }
    80% { transform: translateX(3px); }
}`;

/** Head tilt for looking around */
export const KEYFRAMES_HEAD_TILT = `
@keyframes quillHeadTilt {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    50% { transform: rotate(4deg); }
    75% { transform: rotate(-3deg); }
}`;

/** Rhythmic body dip for writing */
export const KEYFRAMES_WRITE_DIP = `
@keyframes quillWriteDip {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(3px) rotate(2deg); }
    50% { transform: translateY(0) rotate(-1deg); }
    75% { transform: translateY(2px) rotate(1deg); }
}`;

/** Ink stroke pulse for writing */
export const KEYFRAMES_INK_PULSE = `
@keyframes quillInkPulse {
    0%, 100% { opacity: 0.6; stroke-width: 3.5; }
    50% { opacity: 1; stroke-width: 4.5; }
}`;

/** Fast bounce for dancing */
export const KEYFRAMES_DANCE_BOUNCE = `
@keyframes quillDanceBounce {
    0%, 100% { transform: translateY(0) scaleY(1); }
    25% { transform: translateY(-8px) scaleY(1.05); }
    50% { transform: translateY(0) scaleY(0.92); }
    75% { transform: translateY(-6px) scaleY(1.03); }
}`;

/** Body sway for dancing */
export const KEYFRAMES_DANCE_SWAY = `
@keyframes quillDanceSway {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(8deg); }
    75% { transform: rotate(-8deg); }
}`;

/** Fast leg alternation for dancing */
export const KEYFRAMES_DANCE_LEG_LEFT = `
@keyframes quillDanceLegLeft {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(30deg); }
}`;

export const KEYFRAMES_DANCE_LEG_RIGHT = `
@keyframes quillDanceLegRight {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-30deg); }
}`;

/** Walk-out slide to the right */
export const KEYFRAMES_WALK_OUT = `
@keyframes quillWalkOut {
    0% { transform: translateX(0); }
    100% { transform: translateX(150px); }
}`;

/** Jump up */
export const KEYFRAMES_JUMP_UP = `
@keyframes quillJumpUp {
    0% { transform: translateY(0) scaleY(1); }
    15% { transform: translateY(4px) scaleY(0.85); }
    50% { transform: translateY(-30px) scaleY(1.1); }
    100% { transform: translateY(-30px) scaleY(1); }
}`;

/** Zoom off to the right after jumping */
export const KEYFRAMES_ZOOM_OFF = `
@keyframes quillZoomOff {
    0% { transform: translateX(0); opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translateX(300px); opacity: 0; }
}`;

/** Enthusiastic nodding */
export const KEYFRAMES_NOD = `
@keyframes quillNod {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-12deg); }
    50% { transform: rotate(0deg); }
    75% { transform: rotate(-10deg); }
}`;

/** Reduced motion override — disables all mascot animations */
export const REDUCED_MOTION = `
@media (prefers-reduced-motion: reduce) {
    .quill-scene * {
        animation: none !important;
        transition: none !important;
    }
}`;
