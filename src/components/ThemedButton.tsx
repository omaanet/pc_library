import React, { useMemo, useState, CSSProperties, ReactNode } from 'react';
import Color from 'color'; // You'll need to install: npm install color @types/color

// Define theme colors structure
interface ThemeColors {
    base: string;
    hover: string;
    active: string;
    focus: string;
    disabled: string;
    text: string;
}

// Extended CSSProperties to include our custom CSS variables
interface ExtendedCSSProperties extends CSSProperties {
    '--hover-bg'?: string;
    '--active-bg'?: string;
    '--focus-color'?: string;
    '--disabled-color'?: string;
}

// Component props interface
interface ThemedButtonProps {
    children: ReactNode;
    color?: string;
    variant?: 'solid' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    ariaLabel?: string;
    // You can add more button props as needed
}

// Function to generate theme colors from a base color
const generateThemeColors = (baseColor: string): ThemeColors => {
    try {
        // Parse the color string into a Color object
        const color = Color(baseColor);

        return {
            base: baseColor,
            hover: color.darken(0.25).hex(),       // Slightly darker for hover
            active: color.darken(0.2).hex(),      // Even darker for active/pressed
            focus: color.alpha(0.5).hex(),        // Semi-transparent for focus ring
            disabled: color.lighten(0.25).desaturate(0.85).hex(), // Lighter and less saturated for disabled
            text: color.isDark() ? '#ffffff' : '#000000' // Choose text color based on contrast
        };
    } catch (error) {
        console.error("Error generating theme colors:", error);
        // Fallback to a default palette if color parsing fails
        return {
            base: '#6b7280', // gray-500
            hover: '#4b5563', // gray-600
            active: '#374151', // gray-700
            focus: 'rgba(107, 114, 128, 0.5)', // gray-500 with 50% opacity
            disabled: '#d1d5db', // gray-300
            text: '#ffffff'
        };
    }
};

const ThemedButton = ({
    children,
    color = "#6b7280", // Default gray color
    variant = "solid",
    size = "md",
    className = "",
    disabled = false,
    onClick,
    type = "button",
    ariaLabel,
    ...props
}: ThemedButtonProps) => {
    // Button interaction states
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Memoize the theme colors to avoid recalculating on every render
    const themeColors = useMemo(() => generateThemeColors(color), [color]);

    // Size classes
    const sizeClasses = {
        sm: "px-2 py-1 text-xs border rounded-sm",
        md: "px-4 py-2 text-sm border rounded-md",
        lg: "px-6 py-3 text-base border rounded-lg"
    }[size];

    // Common button classes
    const commonClasses = `
    font-medium
    focus:outline-none 
    focus:ring-2 
    focus:ring-offset-2
    transition-colors 
    duration-200
    disabled:cursor-not-allowed
  `;

    // Compute the styles based on variant, state, and if it's disabled
    const computeStyles = (): ExtendedCSSProperties => {
        let styles: ExtendedCSSProperties = {};

        if (disabled) {
            if (variant === 'solid') {
                styles = {
                    backgroundColor: themeColors.disabled,
                    color: themeColors.text,
                    borderColor: 'transparent'
                };
            } else if (variant === 'outline') {
                styles = {
                    backgroundColor: 'transparent',
                    color: themeColors.disabled,
                    borderColor: themeColors.disabled
                };
            } else if (variant === 'ghost') {
                styles = {
                    backgroundColor: 'transparent',
                    color: themeColors.disabled,
                    borderColor: 'transparent'
                };
            }
        } else {
            // Base styles for enabled buttons
            if (variant === 'solid') {
                styles = {
                    backgroundColor: isActive ? themeColors.active : (isHovered ? themeColors.hover : themeColors.base),
                    color: themeColors.text,
                    borderColor: 'transparent'
                };
            } else if (variant === 'outline') {
                const baseColor = Color(themeColors.base);
                styles = {
                    backgroundColor: isActive ? baseColor.alpha(0.75).hexa() :
                        (isHovered ? baseColor.alpha(0.75).hexa() : 'transparent'),
                    color: baseColor.isDark() ? baseColor.lighten(0.75).hex() : baseColor.hex(),
                    borderColor: isHovered ? baseColor.hex() : baseColor.alpha(0.75).hexa()
                };
            } else if (variant === 'ghost') {
                styles = {
                    backgroundColor: isActive ? Color(themeColors.base).alpha(0.5).hexa() :
                        (isHovered ? Color(themeColors.base).alpha(0.5).hexa() : 'transparent'),
                    color: isHovered ? Color(themeColors.base).lighten(0.75).hexa() : themeColors.base,
                    borderColor: 'transparent'
                };
            }
        }

        // Add focus ring color
        styles['--focus-color'] = themeColors.focus;

        return styles;
    };

    // Update the styles whenever state changes
    const buttonStyles = computeStyles();

    return (
        <button
            className={`${sizeClasses} ${commonClasses} ${className}`}
            style={buttonStyles}
            disabled={disabled}
            onClick={onClick}
            type={type}
            aria-label={ariaLabel}
            onMouseEnter={() => {
                if (!disabled) setIsHovered(true);
            }}
            onMouseLeave={() => {
                if (!disabled) {
                    setIsHovered(false);
                    setIsActive(false);
                }
            }}
            onMouseDown={() => {
                if (!disabled) setIsActive(true);
            }}
            onMouseUp={() => {
                if (!disabled) setIsActive(false);
            }}
            {...props}
        >
            {children}
        </button>
    );
};

export default ThemedButton;