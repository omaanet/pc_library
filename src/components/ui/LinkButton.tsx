import { ComponentProps } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

export type LinkButtonProps = Omit<ComponentProps<typeof Button>, 'href'> & {
    /** URL to navigate to or download from */
    url: string;
    /** Optional icon (Lucide) */
    icon?: LucideIcon;
    /** Optional icon size (default: h-4 w-4) */
    iconSize?: string;
};

export function LinkButton({ url, icon: Icon, iconSize = 'h-4 w-4', children, ...props }: LinkButtonProps) {
    // console.log('LinkButton', { url, icon: Icon, iconSize, children, ...props });
    const isInternalAppRoute = url.startsWith('/') && !url.startsWith('/api/') && !url.startsWith('//');
    const content = (
        <>
            {Icon && <Icon className={`${iconSize} mr-1`} />}
            {children}
        </>
    );

    return (
        <Button asChild {...props}>
            {isInternalAppRoute ? (
                <Link href={url} className="ctrLinkButton">
                    {content}
                </Link>
            ) : (
                <a href={url} rel="noopener noreferrer" className="ctrLinkButton">
                    {content}
                </a>
            )}
        </Button>
    );
}
