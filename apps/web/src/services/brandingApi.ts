import api from './api';

export interface BrandConfig {
  colors: {
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
  };
  typography: {
    heading: string;
    subheading: string;
    body: string;
  };
  assets: {
    logoUrl?: string;
    logoDarkUrl?: string;
    faviconUrl?: string;
  };
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

export interface BrandingResponse {
  id: string;
  name: string;
  branding: BrandConfig;
  hasCustomBranding?: boolean;
  inheritsFromOrganization?: boolean;
}

export const brandingApi = {
  // Organization branding
  async getOrganizationBranding(organizationId: string): Promise<BrandingResponse> {
    const response = await api.get(`/branding/organizations/${organizationId}`);
    return response.data;
  },

  async updateOrganizationBranding(organizationId: string, branding: BrandConfig): Promise<BrandingResponse> {
    const response = await api.put(`/branding/organizations/${organizationId}`, { branding });
    return response.data;
  },

  // Property branding
  async getPropertyBranding(propertyId: string): Promise<BrandingResponse> {
    const response = await api.get(`/branding/properties/${propertyId}`);
    return response.data;
  },

  async updatePropertyBranding(propertyId: string, branding: BrandConfig): Promise<BrandingResponse> {
    const response = await api.put(`/branding/properties/${propertyId}`, { branding });
    return response.data;
  },

  async removePropertyBranding(propertyId: string): Promise<BrandingResponse> {
    const response = await api.delete(`/branding/properties/${propertyId}`);
    return response.data;
  },

  // Logo upload
  async uploadLogo(file: File, type: 'logo' | 'logo-dark' | 'favicon' = 'logo'): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('type', type);

    const response = await api.post('/branding/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Branding presets
  async getBrandingPresets(): Promise<Record<string, any>> {
    const response = await api.get('/branding/presets');
    return response.data;
  },
};