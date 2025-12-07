/**
 * Color utilities and helpers
 * Based on Dokifree Design System
 */

import { COLORS } from './index';

/**
 * Convert hex color to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert hex color to RGBA string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  return hexToRgba(color, opacity);
}

/**
 * Predefined color utilities
 */
export const ColorUtils = {
  // Primary with opacity variants
  primaryWithOpacity: (opacity: number) => withOpacity(COLORS.primary.main, opacity),
  
  // Secondary with opacity variants
  secondaryWithOpacity: (opacity: number) => withOpacity(COLORS.secondary.main, opacity),
  
  // Accent colors
  info: COLORS.accent.blue,
  success: COLORS.accent.green,
  warning: COLORS.accent.yellow,
  error: COLORS.accent.red,
  
  // Gray scale
  text: {
    primary: COLORS.gray.darkest,
    secondary: COLORS.gray.medium,
    disabled: COLORS.gray.light,
  },
  
  // Backgrounds
  background: {
    primary: COLORS.gray.white,
    secondary: COLORS.gray.lighter,
    dark: COLORS.gray.darkest,
  },
  
  // Borders
  border: {
    light: COLORS.gray.lighter,
    medium: COLORS.gray.light,
    dark: COLORS.gray.medium,
  },
} as const;

/**
 * Status colors for different states
 */
export const StatusColors = {
  success: COLORS.accent.green,
  error: COLORS.accent.red,
  warning: COLORS.accent.yellow,
  info: COLORS.accent.blue,
  pending: COLORS.secondary.main,
  default: COLORS.gray.medium,
} as const;

export type StatusColor = keyof typeof StatusColors;

