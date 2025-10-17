// src/config/fonts.ts
import { Inter, Dancing_Script, Playfair_Display, Merriweather, Lora, Crimson_Text, EB_Garamond, Open_Sans, Poppins, Roboto, Montserrat, Space_Grotesk } from 'next/font/google';

// ============================================
// FONT CONFIGURATION
// Change fonts here - just update the import and configuration
// ============================================

// Base font for body text
export const baseFont = Inter({
    subsets: ['latin'],
    variable: '--font-base',
});

// Display font for headings and special text
// To change: Replace Dancing_Script with another Google Font
// Example alternatives: Playfair_Display, Merriweather, Lora, Crimson_Text, EB_Garamond, Open_Sans, Poppins, Roboto, Montserrat, Space_Grotesk
export const displayFont = Dancing_Script({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'], // Dancing Script only supports 400-700
    variable: '--font-display',
});

// CSS class to apply display font
export const displayFontClass = 'font-[family-name:var(--font-display)]';
