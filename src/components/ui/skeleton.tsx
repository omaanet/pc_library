// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-primary/10",
                className
            )}
            {...props}
        />
    );
}

// Example usages:
// <Skeleton className="h-4 w-[250px]" />
// <Skeleton className="h-8 w-[200px]" />
// <Skeleton className="aspect-[3/4] w-full" />