import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useTenant } from './TenantContext';
import { generateColorShades as utilGenerateColorShades } from '../utils/colorUtils';

interface BrandColors {
  primary: string;
  primaryShades: {
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
  };
  secondary?: string;
  accent?: string;
  background: string;
  surface: string;
  surfaceHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

interface BrandTypography {
  heading: string;
  subheading: string;
  body: string;
}

interface BrandAssets {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
}

interface BrandConfig {
  colors: BrandColors;
  typography: BrandTypography;
  assets: BrandAssets;
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    soft: string;
    medium: string;
    strong: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

interface ThemeContextType {
  brandConfig: BrandConfig;
  isCustomTheme: boolean;
  applyTheme: (config: Partial<BrandConfig>) => void;
  resetToDefault: () => void;
  generateColorShades: (baseColor: string) => BrandColors['primaryShades'];
  exportTheme: () => string;
  importTheme: (themeJson: string) => void;
}

// Default brand configuration (current Nayara theme)
const DEFAULT_BRAND_CONFIG: BrandConfig = {
  colors: {
    primary: '#AA8E67',
    primaryShades: {
      50: '#FCFAF8',
      100: '#F5EBD7',
      200: '#E8D5B7',
      300: '#DBBF97',
      400: '#CEA977',
      500: '#AA8E67',
      600: '#8B7555',
      700: '#6C5C43',
      800: '#4D4331',
      900: '#2E2A1F'
    },
    secondary: '#7C8E67',
    accent: '#A4C4C8',
    background: '#F5EBD7',
    surface: '#ffffff',
    surfaceHover: '#f8f9fa',
    textPrimary: '#4A4A4A',
    textSecondary: '#606060',
    textMuted: '#808080'
  },
  typography: {
    heading: "'Gotham Black', 'Tahoma', 'Arial', sans-serif",
    subheading: "'Georgia', serif",
    body: "'Proxima Nova', 'Tahoma', 'Arial', sans-serif"
  },
  assets: {
    logoUrl: '/nayara-logo-white.png',
    logoDarkUrl: '/nayara-logo-dark.png',
    faviconUrl: '/favicon.ico'
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem'
  },
  shadows: {
    soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    strong: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  transitions: {
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.6s'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility function to generate color shades from a base color
const generateColorShades = (baseColor: string): BrandColors['primaryShades'] => {
  return utilGenerateColorShades(baseColor);
};

// Apply CSS variables to DOM
const applyCSSVariables = (config: BrandConfig) => {
  const root = document.documentElement;
  
  // Apply color variables
  root.style.setProperty('--brand-primary', config.colors.primary);
  Object.entries(config.colors.primaryShades).forEach(([shade, color]) => {
    root.style.setProperty(`--brand-primary-${shade}`, color);
  });
  
  if (config.colors.secondary) {
    root.style.setProperty('--brand-secondary', config.colors.secondary);
  }
  if (config.colors.accent) {
    root.style.setProperty('--brand-accent', config.colors.accent);
  }
  
  root.style.setProperty('--brand-background', config.colors.background);
  root.style.setProperty('--brand-surface', config.colors.surface);
  root.style.setProperty('--brand-surface-hover', config.colors.surfaceHover);
  root.style.setProperty('--brand-text-primary', config.colors.textPrimary);
  root.style.setProperty('--brand-text-secondary', config.colors.textSecondary);
  root.style.setProperty('--brand-text-muted', config.colors.textMuted);
  
  // Apply typography variables
  root.style.setProperty('--brand-font-heading', config.typography.heading);
  root.style.setProperty('--brand-font-subheading', config.typography.subheading);
  root.style.setProperty('--brand-font-body', config.typography.body);
  
  // Apply border radius variables
  Object.entries(config.borderRadius).forEach(([size, value]) => {
    root.style.setProperty(`--brand-radius-${size}`, value);
  });
  
  // Apply shadow variables
  Object.entries(config.shadows).forEach(([type, value]) => {
    root.style.setProperty(`--brand-shadow-${type}`, value);
  });
  
  // Apply transition variables
  Object.entries(config.transitions).forEach(([speed, value]) => {
    root.style.setProperty(`--brand-transition-${speed}`, value);
  });
  
  // Apply asset variables
  if (config.assets.logoUrl) {
    root.style.setProperty('--brand-logo-url', `"${config.assets.logoUrl}"`);
  }
  if (config.assets.logoDarkUrl) {
    root.style.setProperty('--brand-logo-dark-url', `"${config.assets.logoDarkUrl}"`);
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { organization, property } = useTenant();
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(DEFAULT_BRAND_CONFIG);
  const [isCustomTheme, setIsCustomTheme] = useState(false);

  // Load theme from organization or property branding
  useEffect(() => {
    let customConfig = { ...DEFAULT_BRAND_CONFIG };
    let hasCustomization = false;

    // Check property-level branding first (higher priority)
    if (property?.branding) {
      const propertyBranding = property.branding as any;
      
      if (propertyBranding.primaryColor) {
        customConfig.colors.primary = propertyBranding.primaryColor;
        customConfig.colors.primaryShades = generateColorShades(propertyBranding.primaryColor);
        hasCustomization = true;
      }
      
      if (propertyBranding.secondaryColor) {
        customConfig.colors.secondary = propertyBranding.secondaryColor;
        hasCustomization = true;
      }
      
      if (propertyBranding.backgroundColor) {
        customConfig.colors.background = propertyBranding.backgroundColor;
        hasCustomization = true;
      }
      
      if (propertyBranding.logoUrl) {
        customConfig.assets.logoUrl = propertyBranding.logoUrl;
        hasCustomization = true;
      }
      
      if (propertyBranding.logoDarkUrl) {
        customConfig.assets.logoDarkUrl = propertyBranding.logoDarkUrl;
        hasCustomization = true;
      }
      
      if (propertyBranding.fontHeading) {
        customConfig.typography.heading = propertyBranding.fontHeading;
        hasCustomization = true;
      }
      
      if (propertyBranding.fontBody) {
        customConfig.typography.body = propertyBranding.fontBody;
        hasCustomization = true;
      }
    }
    
    // Fall back to organization-level branding
    if (!hasCustomization && organization?.branding) {
      const orgBranding = organization.branding as any;
      
      if (orgBranding.primaryColor) {
        customConfig.colors.primary = orgBranding.primaryColor;
        customConfig.colors.primaryShades = generateColorShades(orgBranding.primaryColor);
        hasCustomization = true;
      }
      
      if (orgBranding.secondaryColor) {
        customConfig.colors.secondary = orgBranding.secondaryColor;
        hasCustomization = true;
      }
      
      if (orgBranding.backgroundColor) {
        customConfig.colors.background = orgBranding.backgroundColor;
        hasCustomization = true;
      }
      
      if (orgBranding.logoUrl) {
        customConfig.assets.logoUrl = orgBranding.logoUrl;
        hasCustomization = true;
      }
      
      if (orgBranding.logoDarkUrl) {
        customConfig.assets.logoDarkUrl = orgBranding.logoDarkUrl;
        hasCustomization = true;
      }
      
      if (orgBranding.fontHeading) {
        customConfig.typography.heading = orgBranding.fontHeading;
        hasCustomization = true;
      }
      
      if (orgBranding.fontBody) {
        customConfig.typography.body = orgBranding.fontBody;
        hasCustomization = true;
      }
    }

    setBrandConfig(customConfig);
    setIsCustomTheme(hasCustomization);
    applyCSSVariables(customConfig);
  }, [organization, property]);

  const applyTheme = (config: Partial<BrandConfig>) => {
    const newConfig = { ...brandConfig, ...config };
    
    // Auto-generate color shades if primary color changed
    if (config.colors?.primary && config.colors.primary !== brandConfig.colors.primary) {
      newConfig.colors.primaryShades = utilGenerateColorShades(config.colors.primary);
    }
    
    setBrandConfig(newConfig);
    setIsCustomTheme(true);
    applyCSSVariables(newConfig);
  };

  const resetToDefault = () => {
    setBrandConfig(DEFAULT_BRAND_CONFIG);
    setIsCustomTheme(false);
    applyCSSVariables(DEFAULT_BRAND_CONFIG);
  };

  const exportTheme = (): string => {
    return JSON.stringify(brandConfig, null, 2);
  };

  const importTheme = (themeJson: string) => {
    try {
      const importedConfig = JSON.parse(themeJson) as BrandConfig;
      setBrandConfig(importedConfig);
      setIsCustomTheme(true);
      applyCSSVariables(importedConfig);
    } catch (error) {
      console.error('Failed to import theme:', error);
      throw new Error('Invalid theme configuration');
    }
  };

  const value: ThemeContextType = {
    brandConfig,
    isCustomTheme,
    applyTheme,
    resetToDefault,
    generateColorShades,
    exportTheme,
    importTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Utility hooks for specific theme aspects
export const useBrandColors = () => {
  const { brandConfig } = useTheme();
  return brandConfig.colors;
};

export const useBrandTypography = () => {
  const { brandConfig } = useTheme();
  return brandConfig.typography;
};

export const useBrandAssets = () => {
  const { brandConfig } = useTheme();
  return brandConfig.assets;
};

// React component for dynamic logo
export const BrandLogo: React.FC<{
  variant?: 'light' | 'dark';
  className?: string;
  alt?: string;
}> = ({ variant = 'light', className = '', alt = 'Logo' }) => {
  const { brandConfig } = useTheme();
  
  const logoUrl = variant === 'dark' 
    ? brandConfig.assets.logoDarkUrl || brandConfig.assets.logoUrl
    : brandConfig.assets.logoUrl;
  
  if (!logoUrl) {
    return (
      <div className={`bg-gray-300 flex items-center justify-center text-gray-600 font-bold ${className}`}>
        LOGO
      </div>
    );
  }
  
  return (
    <img 
      src={logoUrl} 
      alt={alt}
      className={className}
    />
  );
};