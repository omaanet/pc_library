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
    return (
        <>
            <style jsx>{`
        .draw-path {
          stroke-dasharray: 100;
          stroke-dashoffset: var(--draw-offset, 100);
          animation: draw var(--draw-duration, 3s) ease-in-out var(--draw-iters, infinite) alternate;
          animation-play-state: var(--play-state, running);
          stroke: var(--text);
          stroke-width: 1.5;
          fill: none;
          will-change: stroke-dashoffset;
        }
        
        .glow-anim {
          animation-duration: var(--glow-duration, 2s);
          animation-iteration-count: var(--glow-iters, infinite);
          animation-play-state: var(--play-state, running);
          stroke-width: 1.15;
          fill: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .draw-path, .glow-anim {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className={cn("animatedBookWithSign", className)}
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    '--draw-offset': drawOffset,
                    '--draw-iters': drawIterations,
                    '--draw-duration': drawDuration,
                    '--glow-iters': glowIterations,
                    '--glow-duration': glowDuration,
                    '--play-state': isPaused ? 'paused' : 'running',
                } as React.CSSProperties}
                {...props}
            >
                {/* Book cover */}
                <path className="draw-path" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path className="draw-path" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" style={{ animationDelay: drawDelay }} />
                {/* Sound waves coming out */}
                <path className="glow-anim" d="M9 8c2 0 2 4 4 4" strokeLinecap="round" />
                <path className="glow-anim" d="M9 6c4 0 4 8 8 8" strokeLinecap="round" style={{ animationDelay: glowDelay }} />
            </svg>
        </>
    );
}
