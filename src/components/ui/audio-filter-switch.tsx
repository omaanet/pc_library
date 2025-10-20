import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioFilterSwitchProps {
    checked: boolean | undefined;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    labelText?: string;
    className?: string;
}

export const AudioFilterSwitch: React.FC<AudioFilterSwitchProps> = ({
    checked = false,
    onCheckedChange,
    disabled = false,
    labelText = 'solo Audio Racconti',
    className = '',
}) => {
    return (
        <div
            className={cn(
                'flex flex-row flex-nowrap items-center gap-2 select-none group pe-2',
                disabled && 'opacity-70',
                className
            )}
            data-state={checked ? 'checked' : 'unchecked'}
        >
            <Switch
                id="audioFilter"
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                className={cn(
                    'bg-gray-200',
                    'data-[state=checked]:bg-yellow-400',
                    'group-hover:data-[state=checked]:bg-yellow-200',
                    'group-hover:data-[state=unchecked]:bg-yellow-400',
                    disabled && 'bg-gray-300'
                )}
            />
            <Label
                htmlFor="audioFilter"
                className={cn(
                    'flex flex-row items-center gap-2 cursor-pointer',
                    'text-gray-200',
                    'group-data-[state=checked]:text-yellow-400',
                    'group-hover:group-data-[state=checked]:text-yellow-200',
                    'group-hover:group-data-[state=unchecked]:text-yellow-400',
                    disabled && 'text-gray-300 cursor-not-allowed'
                )}
                aria-label={labelText}
            >
                <Headphones className="h-4 w-4" />
                <span className="hidden sm:inline" aria-hidden="true">{labelText}</span>
            </Label>
        </div>
    );
};

export default AudioFilterSwitch;
