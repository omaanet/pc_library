/**
 * QuillSequence — Orchestrator that chains Quill mascot animations.
 *
 * Usage:
 *   <QuillSequence animations={['walk-in', 'looking-around', 'jump-and-escape']} />
 *
 * Each animation plays in order; when one finishes it advances to the next.
 * After the last animation the component either unmounts (default) or loops.
 */
'use client';

import { useState, useCallback } from 'react';
import { QuillWalkIn } from './quill-walk-in';
import { QuillLookingAround } from './quill-looking-around';
import { QuillWriting } from './quill-writing';
import { QuillDancing } from './quill-dancing';
import { QuillWalkOut } from './quill-walk-out';
import { QuillJumpAndEscape } from './quill-jump-and-escape';

export type QuillAnimationName =
    | 'walk-in'
    | 'looking-around'
    | 'writing'
    | 'dancing'
    | 'walk-out'
    | 'jump-and-escape';

interface QuillSequenceProps {
    /** Ordered list of animations to play */
    animations: QuillAnimationName[];
    className?: string;
    /** Restart the sequence when it finishes */
    loop?: boolean;
    /** Called after the last animation completes (before loop restart) */
    onComplete?: () => void;
}

const ANIMATION_MAP: Record<
    QuillAnimationName,
    React.ComponentType<{ className?: string; onComplete?: () => void }>
> = {
    'walk-in': QuillWalkIn,
    'looking-around': QuillLookingAround,
    'writing': QuillWriting,
    'dancing': QuillDancing,
    'walk-out': QuillWalkOut,
    'jump-and-escape': QuillJumpAndEscape,
};

export function QuillSequence({
    animations,
    className,
    loop = false,
    onComplete,
}: QuillSequenceProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [finished, setFinished] = useState(false);

    const handleComplete = useCallback(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < animations.length) {
            setCurrentIndex(nextIndex);
        } else {
            onComplete?.();
            if (loop) {
                setCurrentIndex(0);
            } else {
                setFinished(true);
            }
        }
    }, [currentIndex, animations.length, loop, onComplete]);

    if (finished || animations.length === 0) return null;

    const animationName = animations[currentIndex];
    const AnimationComponent = ANIMATION_MAP[animationName];

    if (!AnimationComponent) return null;

    return <AnimationComponent key={`${animationName}-${currentIndex}`} className={className} onComplete={handleComplete} />;
}
