# Font Configuration Guide

## How to Change Fonts

All font configuration is centralized in **`src/config/fonts.ts`** for easy management.

### Quick Change

1. Open `src/config/fonts.ts`
2. Replace the font import and configuration
3. That's it! The change applies everywhere automatically.

### Example: Change Display Font

**Current (Dancing Script):**
```typescript
import { Inter, Dancing_Script } from 'next/font/google';

export const displayFont = Dancing_Script({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-display',
});
```

**Change to Playfair Display:**
```typescript
import { Inter, Playfair_Display } from 'next/font/google';

export const displayFont = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-display',
});
```

### Popular Google Font Alternatives

- **Serif/Display:** `Playfair_Display`, `Merriweather`, `Lora`, `Crimson_Text`, `EB_Garamond`
- **Script/Handwriting:** `Dancing_Script`, `Pacifico`, `Great_Vibes`, `Satisfy`
- **Sans-serif:** `Inter`, `Roboto`, `Open_Sans`, `Montserrat`, `Poppins`

### Font Usage

- **Base Font:** Used for body text throughout the site
- **Display Font:** Used for the main heading "Racconti in Voce e Caratteri"

### Technical Details

- Fonts are loaded via Next.js's optimized font system
- CSS variables: `--font-base` and `--font-display`
- Helper class: `displayFontClass` for applying display font
