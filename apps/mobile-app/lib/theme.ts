import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
 
export const THEME = {
  light: {
    background: 'hsl(0 0% 100%)', // #FFFFFF
    foreground: 'hsl(0 0% 5.9%)', // #0F0F0F - Darkgray
    card: 'hsl(0 0% 100%)', // #FFFFFF
    cardForeground: 'hsl(0 0% 5.9%)', // #0F0F0F
    popover: 'hsl(0 0% 100%)', // #FFFFFF
    popoverForeground: 'hsl(0 0% 5.9%)', // #0F0F0F
    primary: 'hsl(255 60% 61%)', // #7C5CDB - Purple main
    primaryForeground: 'hsl(0 0% 100%)', // White
    secondary: 'hsl(27 100% 59%)', // #FF8F2E - Orange main
    secondaryForeground: 'hsl(0 0% 100%)', // White
    muted: 'hsl(0 0% 94.1%)', // #F0F0F0 - Light background
    mutedForeground: 'hsl(0 0% 32.2%)', // #525050 - Mediumgray
    accent: 'hsl(255 72% 93%)', // #E7E4F9 - Purple lightest
    accentForeground: 'hsl(255 48% 44%)', // #463184 - Purple darkest
    destructive: 'hsl(357 100% 68%)', // #FF5E65 - Red
    destructiveForeground: 'hsl(0 0% 100%)', // White
    border: 'hsl(0 0% 94.1%)', // #F0F0F0
    input: 'hsl(0 0% 94.1%)', // #F0F0F0
    ring: 'hsl(255 60% 61%)', // #7C5CDB - Purple main
    radius: '0.75rem', // 12px
    // Silver colors for charts/badges
    chart1: 'hsl(255 60% 61%)', // #7C5CDB - Purple
    chart2: 'hsl(160 99% 33%)', // #019E5B - Green
    chart3: 'hsl(205 100% 52%)', // #0D99FF - Blue
    chart4: 'hsl(47 100% 62%)', // #FFD33F - Yellow
    chart5: 'hsl(27 100% 59%)', // #FF8F2E - Orange
    // Additional colors from design
    info: 'hsl(205 100% 52%)', // #0D99FF - Blue
    success: 'hsl(160 99% 33%)', // #019E5B - Green
    warning: 'hsl(47 100% 62%)', // #FFD33F - Yellow
  },
  dark: {
    background: 'hsl(0 0% 3.9%)',
    foreground: 'hsl(0 0% 98%)',
    card: 'hsl(0 0% 3.9%)',
    cardForeground: 'hsl(0 0% 98%)',
    popover: 'hsl(0 0% 3.9%)',
    popoverForeground: 'hsl(0 0% 98%)',
    primary: 'hsl(0 0% 98%)',
    primaryForeground: 'hsl(0 0% 9%)',
    secondary: 'hsl(0 0% 14.9%)',
    secondaryForeground: 'hsl(0 0% 98%)',
    muted: 'hsl(0 0% 14.9%)',
    mutedForeground: 'hsl(0 0% 63.9%)',
    accent: 'hsl(0 0% 14.9%)',
    accentForeground: 'hsl(0 0% 98%)',
    destructive: 'hsl(0 70.9% 59.4%)',
    border: 'hsl(0 0% 14.9%)',
    input: 'hsl(0 0% 14.9%)',
    ring: 'hsl(300 0% 45%)',
    radius: '0.625rem',
    chart1: 'hsl(220 70% 50%)',
    chart2: 'hsl(160 60% 45%)',
    chart3: 'hsl(30 80% 55%)',
    chart4: 'hsl(280 65% 60%)',
    chart5: 'hsl(340 75% 55%)',
  },
};
 
export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};