/**
 * Design Tokens - UI Style Guidelines
 * Based on the Dokifree App Design System
 */

export const COLORS = {
  // Primary Colors - Purple
  primary: {
    lightest: '#E7E4F9',
    main: '#7C5CDB',
    dark: '#5E44B8',
    darkest: '#463184',
  },
  
  // Secondary Colors - Orange
  secondary: {
    lightest: '#FFE8D4',
    main: '#FF8F2E',
    dark: '#ED6F0D',
    darkest: '#5B3013',
  },
  
  // Silver Colors (Accent/Status)
  accent: {
    blue: '#0D99FF',
    green: '#019E5B',
    yellow: '#FFD33F',
    red: '#FF5E65',
  },
  
  // Grayscale
  gray: {
    darkest: '#0F0F0F',  // Darkgray
    medium: '#525050',   // Mediumgray
    light: '#A0A0A0',    // Lightgray
    lighter: '#F0F0F0',  // Border-Mediumgray / Light background
    white: '#FFFFFF',    // White / Border-White
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    primary: 'SF Pro Display',
    fallback: '-apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
  },
  
  fontSize: {
    '2xs': 8,   // px
    xs: 10,     // px
    sm: 12,     // px
    base: 14,   // px
    md: 16,     // px
    lg: 18,     // px
    xl: 20,     // px
    '2xl': 22,  // px
  },
  
  lineHeight: {
    '2xs': 12,
    xs: 14,
    sm: 16,
    base: 20,
    md: 24,
    lg: 26,
    xl: 28,
    '2xl': 30,
  },
} as const;

export const SPACING = {
  // Grid System - based on 8px base unit
  base: 8,
  grid: {
    xs: 4,    // 0.5 unit
    sm: 8,    // 1 unit
    md: 16,   // 2 units
    lg: 24,   // 3 units
    xl: 32,   // 4 units
    '2xl': 40, // 5 units
    '3xl': 48, // 6 units
  },
} as const;

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,   // Default radius from design
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Button variants based on design
export const BUTTON_VARIANTS = {
  primary: {
    background: COLORS.primary.main,
    text: COLORS.gray.white,
    hover: COLORS.primary.dark,
    pressed: COLORS.primary.darkest,
  },
  secondary: {
    background: COLORS.secondary.main,
    text: COLORS.gray.white,
    hover: COLORS.secondary.dark,
    pressed: COLORS.secondary.darkest,
  },
  outline: {
    background: 'transparent',
    text: COLORS.primary.main,
    border: COLORS.primary.main,
    hover: COLORS.primary.lightest,
  },
  ghost: {
    background: 'transparent',
    text: COLORS.gray.darkest,
    hover: COLORS.gray.lighter,
  },
} as const;

// Input/Textfield styles
export const INPUT_STYLES = {
  background: COLORS.gray.white,
  border: COLORS.gray.lighter,
  borderFocus: COLORS.primary.main,
  text: COLORS.gray.darkest,
  placeholder: COLORS.gray.light,
  disabled: COLORS.gray.lighter,
} as const;

