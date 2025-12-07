# Design System Technical Documentation

## Overview

Dokifree design system is shared across web and mobile platforms through workspace packages.

**Packages:**
- `@dokifree/web-ui` - Web design tokens
- `@dokifree/mobile-ui` - Mobile design tokens

---

## 🎨 Design Tokens

### Color Palette

#### Primary Colors (Purple)

```typescript
primary: {
  lightest: '#E7E4F9',  // Light purple background
  main:     '#7C5CDB',  // Main brand color
  dark:     '#5E44B8',  // Hover states
  darkest:  '#463184',  // Pressed states
}
```

**Usage:**
- Brand identity
- Primary actions (buttons, links)
- Active states
- Focus indicators

#### Secondary Colors (Orange)

```typescript
secondary: {
  lightest: '#FFE8D4',  // Light orange background
  main:     '#FF8F2E',  // Secondary brand color
  dark:     '#ED6F0D',  // Hover states
  darkest:  '#5B3013',  // Pressed states
}
```

**Usage:**
- Secondary actions
- Highlights
- Call-to-action elements
- Accent elements

#### Accent Colors

```typescript
accent: {
  blue:   '#0D99FF',  // Info, links
  green:  '#019E5B',  // Success
  yellow: '#FFD33F',  // Warning
  red:    '#FF5E65',  // Error, danger
}
```

**Status Mapping:**
```typescript
StatusColors = {
  success: accent.green,   // #019E5B
  error:   accent.red,     // #FF5E65
  warning: accent.yellow,  // #FFD33F
  info:    accent.blue,    // #0D99FF
  pending: secondary.main, // #FF8F2E
  default: gray.medium,    // #525050
}
```

#### Grayscale

```typescript
gray: {
  darkest: '#0F0F0F',  // Text primary
  medium:  '#525050',  // Text secondary
  light:   '#A0A0A0',  // Disabled text
  lighter: '#F0F0F0',  // Borders, backgrounds
  white:   '#FFFFFF',  // White
}
```

---

### Typography

**Font Family:**
```typescript
fontFamily: {
  primary:  'SF Pro Display',
  fallback: '-apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
}
```

**Font Sizes (Web):**
```typescript
fontSize: {
  '2xs': 8,   // px
  xs:    10,  // px
  sm:    12,  // px
  base:  16,  // px
  md:    18,  // px
  lg:    20,  // px
  xl:    24,  // px
  '2xl': 28,  // px
}

lineHeight: {
  '2xs': 12,
  xs:    14,
  sm:    18,
  base:  24,
  md:    27,
  lg:    30,
  xl:    36,
  '2xl': 42,
}
```

**Font Sizes (Mobile):**
```typescript
fontSize: {
  '2xs': 8,   // px
  xs:    10,  // px
  sm:    12,  // px
  base:  14,  // px (smaller than web)
  md:    16,  // px
  lg:    18,  // px
  xl:    20,  // px
  '2xl': 22,  // px
}
```

---

### Spacing

**Grid System:** 8px base unit

```typescript
SPACING = {
  base: 8,
  grid: {
    xs:   4,   // 0.5 unit
    sm:   8,   // 1 unit
    md:   16,  // 2 units
    lg:   24,  // 3 units
    xl:   32,  // 4 units
    '2xl': 40, // 5 units
    '3xl': 48, // 6 units
  }
}
```

**Tailwind Mapping:**
```css
.p-xs  → padding: 4px
.p-sm  → padding: 8px
.p-md  → padding: 16px
.p-lg  → padding: 24px
.p-xl  → padding: 32px
```

---

### Border Radius

```typescript
BORDER_RADIUS = {
  none: 0,
  sm:   4,
  md:   8,
  lg:   12,   // Default radius
  xl:   16,
  '2xl': 20,
  full: 9999,
}
```

**Usage:**
- `lg (12px)`: Default for cards, buttons
- `md (8px)`: Input fields
- `full`: Circular elements (avatars)

---

### Shadows

```typescript
SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}
```

---

## 🧩 Component Patterns

### Button Variants

```typescript
BUTTON_VARIANTS = {
  primary: {
    background: COLORS.primary.main,    // #7C5CDB
    text:       COLORS.gray.white,      // #FFFFFF
    hover:      COLORS.primary.dark,    // #5E44B8
    pressed:    COLORS.primary.darkest, // #463184
  },
  secondary: {
    background: COLORS.secondary.main,
    text:       COLORS.gray.white,
    hover:      COLORS.secondary.dark,
    pressed:    COLORS.secondary.darkest,
  },
  outline: {
    background: 'transparent',
    text:       COLORS.primary.main,
    border:     COLORS.primary.main,
    hover:      COLORS.primary.lightest,
  },
  ghost: {
    background: 'transparent',
    text:       COLORS.gray.darkest,
    hover:      COLORS.gray.lighter,
  },
}
```

### Input Styles

```typescript
INPUT_STYLES = {
  background:   COLORS.gray.white,
  border:       COLORS.gray.lighter,
  borderFocus:  COLORS.primary.main,
  text:         COLORS.gray.darkest,
  placeholder:  COLORS.gray.light,
  disabled:     COLORS.gray.lighter,
}
```

---

## 🌐 Web Implementation

### Tailwind Configuration

**Location:** `packages/web-ui/tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          lightest: '#E7E4F9',
          main: '#7C5CDB',
          dark: '#5E44B8',
          darkest: '#463184',
        },
        // ... other colors
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### Usage in Components

```typescript
import { COLORS } from '@dokifree/web-ui/tokens';

// In component
<button 
  style={{ backgroundColor: COLORS.primary.main }}
  className="bg-primary-main hover:bg-primary-dark"
>
  Click Me
</button>
```

---

## 📱 Mobile Implementation

### NativeWind Configuration

**Location:** `packages/mobile-ui/tailwind.config.js`

```javascript
module.exports = {
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          lightest: '#E7E4F9',
          main: '#7C5CDB',
          dark: '#5E44B8',
          darkest: '#463184',
        },
        // ... other colors
      },
    },
  },
};
```

### Usage in React Native

```typescript
import { COLORS } from '@dokifree/mobile-ui/tokens';
import { View, Text } from 'react-native';

// Direct style
<View style={{ backgroundColor: COLORS.primary.main }}>
  <Text style={{ color: COLORS.gray.white }}>Hello</Text>
</View>

// With NativeWind
<View className="bg-primary-main">
  <Text className="text-white">Hello</Text>
</View>
```

---

## 🎨 Component Libraries

### Web (Admin Portal)

**Library:** Radix UI (Headless components)

**Components:**
- Avatar
- Button
- Dialog/Modal
- Dropdown Menu
- Input
- Label
- Select
- Separator
- Tabs
- Tooltip
- Table

**Styling:** Tailwind CSS with custom theme

---

### Mobile (Mobile App)

**Library:** RN Primitives (React Native components)

**Components:**
- Accordion
- Alert Dialog
- Avatar
- Checkbox
- Dialog
- Dropdown Menu
- Input
- Label
- Select
- Separator
- Switch
- Tabs

**Styling:** NativeWind (Tailwind for React Native)

---

## 🔧 Utility Functions

### Color Utilities

```typescript
// Convert hex to RGB
hexToRgb('#7C5CDB') // { r: 124, g: 92, b: 219 }

// Convert hex to RGBA string
hexToRgba('#7C5CDB', 0.5) // 'rgba(124, 92, 219, 0.5)'

// Add opacity to color
withOpacity(COLORS.primary.main, 0.5) // 'rgba(124, 92, 219, 0.5)'
```

### Class Utilities

```typescript
import { cn } from '@/lib/utils';

// Merge Tailwind classes
cn('px-4 py-2', 'px-6') // 'py-2 px-6'

// Conditional classes
cn('base-class', condition && 'conditional-class')
```

---

## 🎨 Design Consistency

### Cross-Platform Consistency

**Same Design Tokens:**
- Colors are identical across web and mobile
- Typography scale aligned
- Spacing system consistent

**Platform-Specific:**
- Font sizes slightly different (mobile smaller)
- Component implementations differ
- Touch targets vs click targets

### Brand Guidelines

**Primary Color (#7C5CDB):**
- Logo color
- Main CTAs
- Links and interactive elements

**Secondary Color (#FF8F2E):**
- Highlights
- Secondary actions
- Special promotions

---

## 📏 Responsive Design

### Web Breakpoints

```typescript
screens: {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
}
```

### Mobile Considerations

- Minimum touch target: 44x44 points
- Safe area insets (iOS notch)
- Platform-specific navigation
- Gesture handling

---

## 🔄 Theme Support

### Dark Mode

**Web:**
```typescript
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
setTheme('dark' | 'light' | 'system');
```

**Mobile:**
```typescript
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme(); // 'light' | 'dark'
```

### Theme Variables

```css
:root {
  --primary: #7C5CDB;
  --secondary: #FF8F2E;
  --background: #FFFFFF;
  --foreground: #0F0F0F;
}

.dark {
  --background: #0F0F0F;
  --foreground: #FFFFFF;
}
```

---

## 📚 Design Resources

### Figma (if applicable)
- Design file link
- Component library
- Design tokens sync

### Documentation
- Color usage guidelines
- Typography scale
- Component patterns
- Accessibility guidelines

---

**Last Updated**: December 2025

