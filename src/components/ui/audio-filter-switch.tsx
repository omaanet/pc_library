import { useMemo } from 'react';
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
    defaultUncheckedColor?: string; // Default color when unchecked
    defaultCheckedColor?: string; // Default color when checked
    hoverUncheckedColor?: string; // Color when unchecked element is hovered like 'yellow-400'
    hoverCheckedColor?: string; // Color when checked element is hovered like 'yellow-200'
    disabledColor?: string; // Color when disabled
}

export const AudioFilterSwitch: React.FC<AudioFilterSwitchProps> = ({
    checked = false,
    onCheckedChange,
    disabled = false,
    labelText = 'solo Audio Racconti',
    className = '',
    defaultUncheckedColor = 'gray-200',
    defaultCheckedColor = 'yellow-400',
    hoverUncheckedColor = 'yellow-400',
    hoverCheckedColor = 'yellow-200',
    disabledColor = 'gray-300',
}) => {
    // Memoize the derived class values to prevent unnecessary recalculations
    const classes = useMemo(() => {
        // Instead of dynamic string templates, we'll use conditional classes with cn()
        // This ensures Tailwind can properly detect and include these classes

        return {
            // Container classes
            container: cn(
                'flex flex-row flex-nowrap items-center gap-2 cursor-pointer select-none group',
                disabled && 'opacity-70',
                disabled && `text-${disabledColor}`,
                className
            ),
            // Switch classes
            switch: cn(
                // Use direct class for default unchecked color
                `bg-${defaultUncheckedColor}`,
                `group-data-[state=checked]:bg-${defaultCheckedColor}`,
                `group-data-[state=checked]:group-hover:bg-${hoverCheckedColor}`,
                `group-data-[state=unchecked]:group-hover:bg-${hoverUncheckedColor}`,
                disabled && `bg-${disabledColor}`
            ),
            // Label classes
            label: cn(
                'flex flex-row items-center gap-2',
                `text-${defaultUncheckedColor}`,
                `group-data-[state=checked]:text-${defaultCheckedColor}`,
                `group-data-[state=checked]:group-hover:text-${hoverCheckedColor}`,
                `group-data-[state=unchecked]:group-hover:text-${hoverUncheckedColor}`,
                disabled && `text-${disabledColor}`
            )
        };
    }, [hoverUncheckedColor, hoverCheckedColor, defaultUncheckedColor, defaultCheckedColor, disabledColor, disabled, className]);

    return (
        <div
            className={classes.container}
            onClick={() => !disabled && onCheckedChange(!checked)}
            data-state={checked ? 'checked' : 'unchecked'}
            data-disabled={disabled}
        >
            <Switch
                id="audioFilter"
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={Boolean(disabled)}
                className={classes.switch}
            />
            <Label
                htmlFor="audioFilter"
                className={classes.label}
                aria-label={labelText}
            >
                <Headphones className="h-4 w-4" />
                <span className="hidden sm:inline" aria-hidden="true">{labelText}</span>
            </Label>
        </div>
    );
};

export default AudioFilterSwitch;
