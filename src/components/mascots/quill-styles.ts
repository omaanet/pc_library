/**
 * Shared CSS keyframe strings for the Quill Mascot sprite.
 *
 * All sprite poses (idle, walking, running, looking, nodding, dancing,
 * writing, jumping) are driven by these keyframes. QuillSprite injects
 * them once into a <style> tag inside the SVG.
 *
 * Speed scaling is achieved via the `--qdur-scale` CSS variable applied
 * to the sprite root; reverse playback via `animation-direction: reverse`
 * applied through the `.qp-reverse` modifier; pause via `.qp-paused`.
 */

/* ────────────────────────────── Idle ────────────────────────────── */

/** Gentle up/down floating idle */
export const KEYFRAMES_FLOAT = `
@keyframes quillFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
}`;

/** Feather tilt wobble ±3° */
export const KEYFRAMES_WOBBLE = `
@keyframes quillWobble {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(3deg); }
    75% { transform: rotate(-3deg); }
}`;

/** Eyelid blink — eyes scaleY collapses for a fraction of the cycle */
export const KEYFRAMES_BLINK = `
@keyframes quillBlink {
    0%, 92%, 100% { transform: scaleY(1); }
    94% { transform: scaleY(0.1); }
    96% { transform: scaleY(1); }
}`;

/** Subtle decorative-barb sway, makes idle never look frozen */
export const KEYFRAMES_BARB_SWAY = `
@keyframes quillBarbSway {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(2deg); }
}`;

/* ───────────────────────── Walking (coupled gait) ───────────────────────── */

/**
 * Front leg (x=34) — lifts and swings forward, then plants. The back leg
 * uses the inverse phase so the two legs are always contralateral.
 */
export const KEYFRAMES_WALK_LEG_FRONT = `
@keyframes quillWalkLegFront {
    0%   { transform: rotate(-22deg); }
    50%  { transform: rotate(24deg); }
    100% { transform: rotate(-22deg); }
}`;

/** Back leg (x=28) — opposite phase to the front leg */
export const KEYFRAMES_WALK_LEG_BACK = `
@keyframes quillWalkLegBack {
    0%   { transform: rotate(24deg); }
    50%  { transform: rotate(-22deg); }
    100% { transform: rotate(24deg); }
}`;

/**
 * Body bob — rises twice per gait cycle so the bounce is on each foot
 * plant, not on one side only.
 */
export const KEYFRAMES_WALK_BOB = `
@keyframes quillWalkBob {
    0%, 50%, 100% { transform: translateY(0); }
    25%, 75%      { transform: translateY(-2px); }
}`;

/** Slight forward lean while walking (~4–5°) */
export const KEYFRAMES_WALK_LEAN = `
@keyframes quillWalkLean {
    0%, 100% { transform: rotate(4deg); }
    50%      { transform: rotate(5deg); }
}`;

/* ───────────────────────── Running ───────────────────────── */

/** Larger stride and faster cycle for the front leg */
export const KEYFRAMES_RUN_LEG_FRONT = `
@keyframes quillRunLegFront {
    0%   { transform: rotate(-40deg); }
    50%  { transform: rotate(44deg); }
    100% { transform: rotate(-40deg); }
}`;

/** Larger stride and faster cycle for the back leg */
export const KEYFRAMES_RUN_LEG_BACK = `
@keyframes quillRunLegBack {
    0%   { transform: rotate(44deg); }
    50%  { transform: rotate(-40deg); }
    100% { transform: rotate(44deg); }
}`;

/** Deeper bob while running */
export const KEYFRAMES_RUN_BOB = `
@keyframes quillRunBob {
    0%, 50%, 100% { transform: translateY(0); }
    25%, 75%      { transform: translateY(-5px); }
}`;

/** Strong forward lean while running (~10°) */
export const KEYFRAMES_RUN_LEAN = `
@keyframes quillRunLean {
    0%, 100% { transform: rotate(10deg); }
    50%      { transform: rotate(11deg); }
}`;

/* ───────────────────────── Looking around ───────────────────────── */

/**
 * Looking around — bend the upper spine right, return to center, then left,
 * then return to center. No fake eye motion: the top of the trunk curve does
 * the looking. Rotation pivots from the pelvis (32, 82) so the top end of the
 * line swings while the feet stay planted.
 */
// NOTE: Looking animation now uses KEYFRAMES_HEAD_TILT for rotation-based movement.
// KEYFRAMES_LOOK_AROUND was removed as it's no longer referenced in the sprite.

/** Right → center → left → center (trunk top acts as the "head"). */
export const KEYFRAMES_HEAD_TILT = `
@keyframes quillHeadTilt {
    0%   { transform: rotate(0deg); }
    20%  { transform: rotate(10deg); }
    35%  { transform: rotate(10deg); }
    50%  { transform: rotate(0deg); }
    70%  { transform: rotate(-10deg); }
    85%  { transform: rotate(-10deg); }
    100% { transform: rotate(0deg); }
}`;

/* ───────────────────────── Writing ───────────────────────── */

/**
 * Writing — the mascot IS a quill, so the body itself traces short rhythmic
 * pen-strokes on an invisible surface. Combines a small horizontal dab with
 * a tiny downward dip and a wrist-like rotation. Stays subtle so the cadence
 * reads as deliberate writing rather than shaking.
 */
export const KEYFRAMES_WRITE_DIP = `
@keyframes quillWriteDip {
    0%   { transform: translate(0, 0) rotate(0deg); }
    15%  { transform: translate(-1px, 2px) rotate(-3deg); }
    30%  { transform: translate(2px, 3px) rotate(2deg); }
    45%  { transform: translate(3px, 2px) rotate(4deg); }
    60%  { transform: translate(1px, 3px) rotate(-2deg); }
    75%  { transform: translate(-1px, 2px) rotate(-3deg); }
    90%  { transform: translate(2px, 3px) rotate(3deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
}`;

/** Ink stroke pulse for writing */
export const KEYFRAMES_INK_PULSE = `
@keyframes quillInkPulse {
    0%, 100% { opacity: 0.6; stroke-width: 3.5; }
    50% { opacity: 1; stroke-width: 4.5; }
}`;

/* ───────────────────────── Dancing ───────────────────────── */

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

/* ───────────────────────── Nodding ───────────────────────── */

/**
 * Nodding — bend the spine forward and back on one side only. Pivots from
 * the pelvis (set via transform-origin in POSE_STYLES) so the top of the
 * trunk dips like an affirmative head-nod while the feet stay still.
 */
export const KEYFRAMES_NOD = `
@keyframes quillNod {
    0%   { transform: rotate(0deg); }
    45%  { transform: rotate(-14deg); }
    100% { transform: rotate(0deg); }
}`;

/* ───────────────────────── Jumping ─────────────────────────
 * Anticipation crouch → launch → apex hover → fall → landing squash.
 * One full cycle ~0.9s. Used as a held pose while the controller
 * drives horizontal displacement imperatively.
 */
export const KEYFRAMES_JUMP_BODY = `
@keyframes quillJumpBody {
    0%   { transform: translateY(0) scale(1, 1); }
    12%  { transform: translateY(6px) scale(1.15, 0.78); }
    38%  { transform: translateY(-32px) scale(0.92, 1.12); }
    55%  { transform: translateY(-38px) scale(1, 1); }
    82%  { transform: translateY(0) scale(1, 1); }
    95%  { transform: translateY(2px) scale(1.1, 0.88); }
    100% { transform: translateY(0) scale(1, 1); }
}`;

/** Legs tuck up during the airborne portion */
export const KEYFRAMES_JUMP_LEG_TUCK = `
@keyframes quillJumpLegTuck {
    0%, 100%   { transform: rotate(0deg); }
    38%, 55%   { transform: rotate(-30deg); }
}`;

/* ───────────────────────── Climbing ─────────────────────────
 * Used by enterFrom('top') and enterFrom('bottom'). Reuses the walking
 * gait timing but rotates each leg further past vertical to suggest
 * reaching for a foothold (rungs of a ladder). The trunk stays upright
 * and adds a small horizontal sway to suggest reaching with the body.
 */
export const KEYFRAMES_CLIMB_LEG_FRONT = `
@keyframes quillClimbLegFront {
    0%   { transform: rotate(-32deg); }
    50%  { transform: rotate(28deg); }
    100% { transform: rotate(-32deg); }
}`;

export const KEYFRAMES_CLIMB_LEG_BACK = `
@keyframes quillClimbLegBack {
    0%   { transform: rotate(28deg); }
    50%  { transform: rotate(-32deg); }
    100% { transform: rotate(28deg); }
}`;

/** Upright trunk with a subtle side-to-side reach */
export const KEYFRAMES_CLIMB_SWAY = `
@keyframes quillClimbSway {
    0%, 100% { transform: rotate(-2deg); }
    50%      { transform: rotate(2deg); }
}`;

/** Slight vertical bob synced with the foot plants */
export const KEYFRAMES_CLIMB_BOB = `
@keyframes quillClimbBob {
    0%, 50%, 100% { transform: translateY(0); }
    25%, 75%      { transform: translateY(-1px); }
}`;

/* ───────────────────────── Pose crossfade ───────────────────────── */

/** Outgoing pose fade — applied for ~120ms when switching poses */
export const KEYFRAMES_CROSSFADE_OUT = `
@keyframes quillCrossfadeOut {
    from { opacity: 1; }
    to   { opacity: 0; }
}`;

/** Incoming pose fade */
export const KEYFRAMES_CROSSFADE_IN = `
@keyframes quillCrossfadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}`;

/** Reduced motion override — disables all mascot animations */
export const REDUCED_MOTION = `
@media (prefers-reduced-motion: reduce) {
    .quill-scene * {
        animation: none !important;
        transition: none !important;
    }
}`;
