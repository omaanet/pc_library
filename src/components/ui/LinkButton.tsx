import { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

export type LinkButtonProps = Omit<ComponentProps<typeof Button>, 'href'> & {
    /** URL to navigate to or download from */
    url: string;
    /** Optional icon (Lucide) */
    icon?: LucideIcon;
};

export function LinkButton({ url, icon: Icon, children, ...props }: LinkButtonProps) {
    return (
        <Button asChild {...props}>
            <a href={url} rel="noopener noreferrer">
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {children}
            </a>
        </Button>
    );
}
