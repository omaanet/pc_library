'use client';

import Link from 'next/link';
import { siteTitle } from '@/config/metadata';

interface PromoHomeLinkProps {
    className?: string;
}

export function PromoHomeLink({ className = '' }: PromoHomeLinkProps) {
    // className={`absolute left-4 top-4 z-20 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full ps-4 pe-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:left-6 sm:top-6 ${className}`}
    return (
        <Link
            href="/"
            aria-label={`Vai alla home di ${siteTitle}`}
            className={`absolute left-4 top-4 z-20 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full ps-4 pe-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none sm:left-6 sm:top-6 ${className}`}
        >
            <svg
                width="28"
                height="32"
                viewBox="0 0 80 110"
                fill="none"
                stroke="currentColor"
                className="h-8 w-7 flex-shrink-0"
                aria-hidden="true"
            >
                <g
                    transform="translate(-20.5 -5.5)"
                    strokeWidth="4"
                    shapeRendering="geometricPrecision"
                    vectorEffect="non-scaling-stroke"
                >
                    <path
                        d="M20.5 90.5 C 20 90, 40 50, 80 10 C 80 10, 60 40, 50 60"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M20.5 90.5 C 25 90, 30 95, 35 90 S 45 85, 50 90 S 60 95, 65 90"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-current opacity-70"
                    />
                </g>
            </svg>
            <span className="min-w-0 truncate">{siteTitle}</span>
        </Link>
    );
}
