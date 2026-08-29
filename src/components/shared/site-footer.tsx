import type { ReactNode } from 'react';
import Link from 'next/link';
import { CopyrightFooter } from '@/components/shared/copyright-footer';
import { cn } from '@/lib/utils';

interface SiteFooterProps {
    decoration?: ReactNode;
    emphasizeNames?: boolean;
    className?: string;
}

export function SiteFooter({ decoration, emphasizeNames = false, className }: SiteFooterProps) {
    return (
        <footer className={cn('mt-auto w-full border-t py-4 md:py-2', className)}>
            <div
                className={cn(
                    'container mx-auto flex flex-col items-center gap-2 px-4 text-sm leading-relaxed text-muted-foreground md:min-h-14 md:flex-row md:gap-4'
                )}
            >
                <p className="text-center md:shrink-0 md:whitespace-nowrap md:text-left md:text-xs lg:text-sm">
                    <CopyrightFooter lang="it" detailed emphasizeNames={emphasizeNames} />
                </p>

                {decoration && (
                    <div
                        className="hidden flex-1 justify-center lg:flex [&_.AbstractProfile]:h-14"
                        aria-hidden="true"
                    >
                        {decoration}
                    </div>
                )}

                <nav
                    aria-label="Informazioni legali"
                    className="flex shrink-0 items-center justify-center gap-x-5 gap-y-2 md:ml-auto md:text-right"
                >
                    <Link className="underline-offset-4 hover:text-foreground hover:underline" href="/privacy">
                        Privacy
                    </Link>
                    <Link className="underline-offset-4 hover:text-foreground hover:underline" href="/cookies">
                        Cookie
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
