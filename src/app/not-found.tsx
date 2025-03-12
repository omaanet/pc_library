// src/app/not-found.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Page Not Found',
    description: "The page youre looking for doesn't exist or has been moved.",
};

export default function NotFound() {
    return (
        <div className="container-fluid flex-1 flex flex-col items-center justify-center min-h-[80vh] gap-6">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-bold tracking-tight">404</h1>
                <h2 className="text-2xl font-semibold tracking-tight">Page Not Found</h2>
                <p className="text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
            </div>
            <Button asChild>
                <Link href="/">Return Home</Link>
            </Button>
        </div>
    );
}