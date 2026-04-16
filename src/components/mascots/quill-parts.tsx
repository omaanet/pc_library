/**
 * Shared SVG sub-components for the Quill Mascot character.
 * Each part is a <g> group meant to be composed inside a parent <svg>.
 * Parts accept className/style so scenes can attach different animations.
 */

interface PartProps {
    className?: string;
    style?: React.CSSProperties;
}

/** Feather quill body — adapted from the logo in root-nav.tsx */
export function QuillBody({ className, style }: PartProps) {
    return (
        <g className={className} style={style}>
            <path
                d="M30 82 C 28 80, 45 45, 75 12 C 75 12, 58 38, 50 55"
                stroke="var(--text-quill)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            {/* Feather barbs */}
            <path
                d="M55 35 C 60 30, 68 28, 72 18"
                stroke="var(--text-quill)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
            />
            <path
                d="M48 50 C 55 42, 62 38, 68 28"
                stroke="var(--text-quill)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
            />
        </g>
    );
}

/** Tiny stick legs at the base of the quill */
export function QuillLegs({ className, style }: PartProps) {
    return (
        <g className={className} style={style} stroke="var(--text-quill)" strokeWidth="2.5" strokeLinecap="round" fill="none">
            {/* Left leg */}
            <g className="quill-leg-left">
                <path d="M28 82 L 22 96" />
                {/* Foot */}
                <path d="M22 96 L 18 96" strokeWidth="2" />
            </g>
            {/* Right leg */}
            <g className="quill-leg-right">
                <path d="M34 80 L 40 96" />
                {/* Foot */}
                <path d="M40 96 L 44 96" strokeWidth="2" />
            </g>
        </g>
    );
}

/** Small dot eyes near the top curve of the feather */
export function QuillEyes({ className, style }: PartProps) {
    return (
        <g className={className} style={style}>
            {/* Eye */}
            <circle
                cx="62"
                cy="27"
                r="2.5"
                fill="var(--text-quill)"
                stroke="none"
            />
            {/* Pupil highlight */}
            <circle
                cx="63"
                cy="26"
                r="0.8"
                fill="var(--gold-main)"
                stroke="none"
            />
        </g>
    );
}

/** Gold ink wave trail — adapted from the logo wave */
export function QuillInkTrail({ className, style }: PartProps) {
    return (
        <g className={className} style={style}>
            <path
                d="M18 96 C 22 96, 26 100, 30 96 S 38 92, 42 96 S 50 100, 54 96"
                stroke="var(--gold-main)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            >
                <animate
                    attributeName="d"
                    values="M18 96 C 22 96, 26 100, 30 96 S 38 92, 42 96 S 50 100, 54 96;
                            M18 96 C 22 94, 26 98, 30 96 S 38 94, 42 96 S 50 98, 54 96;
                            M18 96 C 22 96, 26 100, 30 96 S 38 92, 42 96 S 50 100, 54 96"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </path>
        </g>
    );
}
