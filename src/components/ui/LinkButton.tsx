import { ComponentProps } from 'react';
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
    return (
        <Button asChild {...props}>
            <a href={url} rel="noopener noreferrer" className="ctrLinkButton">
                {Icon && <Icon className={`${iconSize} mr-1`} />}
                {children}
            </a>
        </Button>
    );
}
