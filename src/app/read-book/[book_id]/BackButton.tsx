// BackButton.js - Client Component
'use client'; // Mark as client component

import { useRouter } from 'next/navigation';
import { ArrowLeft, CornerUpLeft } from 'lucide-react';

export function BackButton() {
    const router = useRouter();

    const handleBackClick = () => {
        // Play a subtle haptic feedback on mobile if available
        if (navigator.vibrate) {
            navigator.vibrate(40);
        }
        router.back();
    };

    return (
        <button onClick={handleBackClick} className="fixed top-4 left-4 z-20 text-[#8dec6f] hover:text-[#70bc58] transition-colors">
            <CornerUpLeft className="h-10 w-10" />
        </button>
    );
}
