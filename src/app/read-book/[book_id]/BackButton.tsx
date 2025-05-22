'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CornerUpLeft } from 'lucide-react'; // Removed unused ArrowLeft import

export function BackButton() {
    const router = useRouter();

    const [supportsVibration, setSupportsVibration] = useState(false);

    // Check for vibration support after mount
    useEffect(() => {
        setSupportsVibration(
            typeof window !== 'undefined' &&
            'vibrate' in window.navigator &&
            typeof window.navigator.vibrate === 'function'
        );
    }, []);

    const handleBackClick = () => {
        // Play a subtle haptic feedback on mobile if available
        if (supportsVibration) {
            try {
                window.navigator.vibrate(40);
            } catch (error) {
                console.error('Vibration failed:', error);
            }
        }
        router.back();
    };

    return (
        <button onClick={handleBackClick} className="fixed top-4 left-4 z-20 text-[#8dec6f] hover:text-[#70bc58] transition-colors">
            <CornerUpLeft className="h-10 w-10" />
        </button>
    );
}
