/**
 * Color utility functions for the white-label branding system
 */

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Generate color shades from a base color
 */
export function generateColorShades(baseColor: string): ColorShades {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    throw new Error('Invalid color format');
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const shades: ColorShades = {
    50: '',
    100: '',
    200: '',
    300: '',
    400: '',
    500: baseColor, // Base color
    600: '',
    700: '',
    800: '',
    900: ''
  };

  // Generate lighter shades (50-400)
  const lightSteps = [
    { shade: 50, lightness: Math.min(95, hsl.l + (95 - hsl.l) * 0.9) },
    { shade: 100, lightness: Math.min(90, hsl.l + (90 - hsl.l) * 0.75) },
    { shade: 200, lightness: Math.min(80, hsl.l + (80 - hsl.l) * 0.6) },
    { shade: 300, lightness: Math.min(70, hsl.l + (70 - hsl.l) * 0.4) },
    { shade: 400, lightness: Math.min(60, hsl.l + (60 - hsl.l) * 0.2) }
  ];

  // Generate darker shades (600-900)
  const darkSteps = [
    { shade: 600, lightness: Math.max(5, hsl.l - (hsl.l - 5) * 0.2) },
    { shade: 700, lightness: Math.max(5, hsl.l - (hsl.l - 5) * 0.4) },
    { shade: 800, lightness: Math.max(5, hsl.l - (hsl.l - 5) * 0.6) },
    { shade: 900, lightness: Math.max(5, hsl.l - (hsl.l - 5) * 0.8) }
  ];

  // Apply lighter shades
  lightSteps.forEach(({ shade, lightness }) => {
    const newRgb = hslToRgb(hsl.h, hsl.s, lightness);
    shades[shade as keyof ColorShades] = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  });

  // Apply darker shades
  darkSteps.forEach(({ shade, lightness }) => {
    const newRgb = hslToRgb(hsl.h, hsl.s, lightness);
    shades[shade as keyof ColorShades] = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  });

  return shades;
}

/**
 * Check if a color is light or dark (for determining text color)
 */
export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

/**
 * Get contrasting text color (black or white) for a given background
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
}

/**
 * Adjust color brightness
 */
export function adjustBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const adjust = (value: number) => {
    const adjusted = value + amount;
    return Math.max(0, Math.min(255, adjusted));
  };

  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
}

/**
 * Mix two colors
 */
export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;

  const mixed = {
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio)
  };

  return rgbToHex(mixed.r, mixed.g, mixed.b);
}

/**
 * Validate if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Get accessible color combinations
 */
export function getAccessibleColorPairs(baseColor: string) {
  const shades = generateColorShades(baseColor);
  
  return {
    // Light theme combinations
    light: {
      primary: shades[500],
      primaryHover: shades[600],
      primaryText: getContrastingTextColor(shades[500]),
      background: shades[50],
      surface: '#FFFFFF',
      text: shades[900],
      textSecondary: shades[600]
    },
    // Dark theme combinations
    dark: {
      primary: shades[400],
      primaryHover: shades[300],
      primaryText: getContrastingTextColor(shades[400]),
      background: shades[900],
      surface: shades[800],
      text: shades[50],
      textSecondary: shades[300]
    }
  };
}

/**
 * Brand preset color palettes
 */
export const brandPresets = {
  luxury: {
    primary: '#B8860B',
    secondary: '#8B4513',
    accent: '#CD853F',
    background: '#FDF5E6'
  },
  modern: {
    primary: '#4285F4',
    secondary: '#34A853',
    accent: '#FBBC04',
    background: '#FFFFFF'
  },
  boutique: {
    primary: '#E91E63',
    secondary: '#9C27B0',
    accent: '#FF5722',
    background: '#F8F9FA'
  },
  nature: {
    primary: '#2E7D32',
    secondary: '#388E3C',
    accent: '#4CAF50',
    background: '#E8F5E8'
  },
  ocean: {
    primary: '#0277BD',
    secondary: '#0288D1',
    accent: '#03DAC6',
    background: '#E3F2FD'
  }
};