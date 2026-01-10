import React from 'react';
import { cn } from '@/lib/utils';

interface BookWithSignProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    drawOffset?: number;
    drawIterations?: string | number;
    drawDuration?: string;
    glowIterations?: string | number;
    glowDuration?: string;
    drawDelay?: string;
    glowDelay?: string;
    isPaused?: boolean;
}

/**
 * Animated BookWithSign component with theme-aware styling and global animations.
 * Conceptually similar to BookOpen but with customized animations and controls.
 */
export function BookWithSign({
    className,
    drawOffset = 100,
    drawIterations = 'infinite',
    drawDuration = '3s',
    glowIterations = 'infinite',
    glowDuration = '2s',
    drawDelay = '0.5s',
    glowDelay = '0.2s',
    isPaused = false,
    ...props
}: BookWithSignProps) {
    const playState = isPaused ? 'paused' : 'running';

    const drawPathStyle: React.CSSProperties = {
        strokeDasharray: 100,
        strokeDashoffset: drawOffset,
        animation: `draw ${drawDuration} ease-in-out ${drawIterations} alternate`,
        animationPlayState: playState,
        stroke: 'var(--text)',
        strokeWidth: 1.125,
        fill: 'none',
        willChange: 'stroke-dashoffset',
    };

    const glowAnimStyle: React.CSSProperties = {
        animation: `glowPulse ${glowDuration} ease-in-out ${glowIterations} alternate`,
        animationPlayState: playState,
        strokeWidth: 0.925,
        fill: 'none',
    };

    return (
        <svg
            width="24"
            height="24"
            viewBox="3 0 24 24"
            fill="none" stroke="currentColor"
            className={cn("animatedBookWithSign", className)}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <style>
                {`
                @media (prefers-reduced-motion: reduce) {
                    .draw-path, .glow-anim {
                        animation: none !important;
                        stroke-dashoffset: 0 !important;
                    }
                }
                `}
            </style>
            <g strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision" vectorEffect="non-scaling-stroke">
                {/* Book cover */}
                <path
                    className="draw-path"
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                    style={drawPathStyle}
                />
                <path
                    className="draw-path"
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    style={{ ...drawPathStyle, animationDelay: drawDelay }}
                />
                {/* Sound waves coming out */}
                <path
                    className="glow-anim"
                    d="M9 8c2 0 2 4 4 4"
                    strokeLinecap="round"
                    style={glowAnimStyle}
                />
                <path
                    className="glow-anim"
                    d="M9 6c4 0 4 8 8 8"
                    strokeLinecap="round"
                    style={{ ...glowAnimStyle, animationDelay: glowDelay }}
                />
            </g>
        </svg>
    );
}
