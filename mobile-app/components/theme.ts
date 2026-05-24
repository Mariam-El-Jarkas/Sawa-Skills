// ── Light palette (default) ───────────────────────────────────────────────────
export const C = {
  violet600: '#7C3AED',
  violet500: '#8B5CF6',
  violet400: '#A78BFA',
  violet300: '#C4B5FD',
  violet200: '#DDD6FE',
  violet100: '#EDE9FE',
  violet50:  '#F5F3FF',
  // Semantic aliases – purple-only
  pink500:    '#8B5CF6',  // was pink,   now violet500
  gray50:    '#F9FAFB',
  gray100:   '#F3F4F6',
  gray200:   '#E5E7EB',
  gray300:   '#D1D5DB',
  gray400:   '#9CA3AF',
  gray500:   '#6B7280',
  gray600:   '#4B5563',
  gray700:   '#374151',
  gray800:   '#1F2937',
  gray900:   '#111827',
  white:     '#FFFFFF',
  green500:  '#8B5CF6',  // was green,  now violet500
  red600:    '#5B21B6',  // was red,    now deep violet (destructive)
  red100:    '#EDE9FE',  // was red bg, now violet100
  red50:     '#F5F3FF',  // was red bg, now violet50
  amber100:  '#EDE9FE',  // was amber,  now violet100
  amber700:  '#5B21B6',  // was amber,  now deep violet
  yellow400: '#A78BFA',  // was yellow, now violet400 (stars)
  emerald800:'#4C1D95',  // was green,  now deep violet
  emerald600:'#6D28D9',  // was green,  now violet700
  emerald100:'#EDE9FE',  // was green,  now violet100
  emerald50: '#F5F3FF',  // was green,  now violet50
};

// ── Dark palette ──────────────────────────────────────────────────────────────
export const CD: typeof C = {
  violet600: '#7C3AED',
  violet500: '#8B5CF6',
  violet400: '#A78BFA',
  violet300: '#C4B5FD',
  violet200: '#4C1D95',
  violet100: '#3B1680',
  violet50:  '#2D1060',
  pink500:    '#8B5CF6',
  gray50:    '#0F0F1A',
  gray100:   '#1C1C2E',
  gray200:   '#2D2D44',
  gray300:   '#3D3D5C',
  gray400:   '#6B7280',
  gray500:   '#9CA3AF',
  gray600:   '#D1D5DB',
  gray700:   '#E5E7EB',
  gray800:   '#F3F4F6',
  gray900:   '#F9FAFB',
  white:     '#1C1C2E',
  green500:  '#A78BFA',
  red600:    '#7C3AED',  // deep violet for destructive in dark
  red100:    '#3B1680',
  red50:     '#2D1060',
  amber100:  '#3B1680',
  amber700:  '#C4B5FD',
  yellow400: '#C4B5FD',  // lighter violet for stars in dark
  emerald800:'#C4B5FD',
  emerald600:'#A78BFA',
  emerald100:'#3B1680',
  emerald50: '#2D1060',
};

export const G = {
  header:      ['#7B4BBF', '#9B6FD9'] as const,
  violet:      ['#7C3AED', '#8B5CF6'] as const,
  violetLight: ['#8B5CF6', '#C4B5FD'] as const,
  splash:      ['#7B4BBF', '#9B6FD9', '#D0BCFC'] as const,
  hero:        ['#7C3AED', '#8B5CF6', '#A78BFA'] as const,
};

export const GD = {
  header:      ['#3B1680', '#5B2EA0'] as const,
  violet:      ['#7C3AED', '#8B5CF6'] as const,
  violetLight: ['#4C1D95', '#7C3AED'] as const,
  splash:      ['#2D1060', '#4C1D95', '#7C3AED'] as const,
  hero:        ['#3B1680', '#5B2EA0', '#7C3AED'] as const,
};

export type ThemeColors = typeof C;
export type ThemeGradients = typeof G;
