// BackButton.js - Client Component
'use client'; // Mark as client component

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
    const router = useRouter();

    const handleBackClick = () => {
        router.back();
    };

    return (
        <button onClick={handleBackClick} className="fixed top-2 left-1 z-20">
            <ArrowLeft className="h-8 w-8 text-gray-700" />
        </button>
    );
}
