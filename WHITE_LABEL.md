# White-Label Implementation Guide

## Overview

Hotel Operations Hub provides comprehensive white-labeling capabilities, allowing organizations to fully customize the platform's appearance to match their brand identity. The system supports custom logos, colors, fonts, styling, and even custom domains.

## White-Label Architecture

### Branding Hierarchy

```
Platform Level (Default Branding)
├── Organization Level (Chain Branding)
│   ├── Applied to all properties in the chain
│   └── Can be overridden at property level
└── Property Level (Individual Hotel Branding)
    └── Specific to individual properties
```

### Branding Inheritance Model

1. **Platform Default**: Base styling and branding
2. **Organization Override**: Chain-wide branding applied to all properties
3. **Property Override**: Property-specific branding (highest priority)

## Database Schema

### Branding Configuration

```sql
-- Branding configurations table
CREATE TABLE branding_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant context
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- NULL for org-level branding
    
    -- Basic brand information
    brand_name TEXT,
    brand_description TEXT,
    
    -- Logo assets
    logo_light_url TEXT, -- Logo for light backgrounds
    logo_dark_url TEXT,  -- Logo for dark backgrounds
    logo_icon_url TEXT,  -- Icon/favicon
    logo_text TEXT,      -- Text-only fallback
    
    -- Color system (stored as JSON for flexibility)
    colors JSONB NOT NULL DEFAULT '{}', -- Complete color palette
    
    -- Typography settings
    typography JSONB NOT NULL DEFAULT '{}', -- Font configuration
    
    -- Component styling
    components JSONB NOT NULL DEFAULT '{}', -- Component-specific styles
    
    -- Advanced customization
    custom_css TEXT, -- Custom CSS rules
    custom_js TEXT,  -- Custom JavaScript (for advanced users)
    
    -- Domain configuration
    custom_domain TEXT UNIQUE, -- Custom domain for this brand
    custom_domain_verified BOOLEAN DEFAULT FALSE,
    
    -- Theme metadata
    theme_mode TEXT DEFAULT 'LIGHT' CHECK (theme_mode IN ('LIGHT', 'DARK', 'AUTO')),
    accessibility_mode BOOLEAN DEFAULT FALSE,
    
    -- Status and versioning
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    version INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE (organization_id, property_id), -- One config per org/property combination
    
    -- Ensure property belongs to organization
    CONSTRAINT branding_configs_property_org_check 
        CHECK (property_id IS NULL OR 
               EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.organization_id = branding_configs.organization_id))
);

-- Branding assets table (for file management)
CREATE TABLE branding_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branding_config_id UUID NOT NULL REFERENCES branding_configs(id) ON DELETE CASCADE,
    
    -- Asset information
    asset_type TEXT NOT NULL CHECK (asset_type IN ('LOGO_LIGHT', 'LOGO_DARK', 'LOGO_ICON', 'FONT_FILE', 'CUSTOM_ASSET')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- Usage information
    usage_context TEXT, -- Where this asset is used
    alt_text TEXT,      -- Accessibility text
    
    -- Metadata
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id)
);

-- Branding history (for version control)
CREATE TABLE branding_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branding_config_id UUID NOT NULL REFERENCES branding_configs(id) ON DELETE CASCADE,
    
    -- Snapshot of configuration
    colors JSONB,
    typography JSONB,
    components JSONB,
    custom_css TEXT,
    
    -- Change information
    change_description TEXT,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Color System

### Color Configuration Schema

```typescript
interface ColorConfig {
  // Primary colors
  primary: {
    50: string;   // Lightest shade
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // Base color
    600: string;
    700: string;
    800: string;
    900: string;  // Darkest shade
  };
  
  // Secondary colors
  secondary: {
    50: string;
    // ... same structure
    900: string;
  };
  
  // Accent colors
  accent: {
    50: string;
    // ... same structure
    900: string;
  };
  
  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Neutral colors
  neutral: {
    white: string;
    gray: {
      50: string;
      // ... same structure
      900: string;
    };
    black: string;
  };
  
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  
  // Border colors
  border: {
    light: string;
    medium: string;
    heavy: string;
  };
}
```

### Default Color Palette

```typescript
const defaultColors: ColorConfig = {
  primary: {
    50: '#faf7f0',
    100: '#f5ebd7', // Base sand color
    200: '#ead5b8',
    300: '#ddbf99',
    400: '#d0a97a',
    500: '#aa8e67', // Warm gold
    600: '#987d5a',
    700: '#7a634b',
    800: '#5c4a38',
    900: '#3e3125',
  },
  // ... rest of the configuration
};
```

## Typography System

### Typography Configuration

```typescript
interface TypographyConfig {
  // Font families
  fontFamilies: {
    heading: string;    // For headings (e.g., "Gotham Black")
    subheading: string; // For subheadings (e.g., "Georgia Italic")
    body: string;       // For body text (e.g., "Proxima Nova")
    mono: string;       // For code/monospace
  };
  
  // Font URLs (Google Fonts or custom)
  fontUrls: string[];
  
  // Font sizes (in rem)
  fontSizes: {
    xs: string;   // 0.75rem
    sm: string;   // 0.875rem
    base: string; // 1rem
    lg: string;   // 1.125rem
    xl: string;   // 1.25rem
    '2xl': string; // 1.5rem
    '3xl': string; // 1.875rem
    '4xl': string; // 2.25rem
    '5xl': string; // 3rem
    '6xl': string; // 3.75rem
  };
  
  // Font weights
  fontWeights: {
    light: number;   // 300
    normal: number;  // 400
    medium: number;  // 500
    semibold: number; // 600
    bold: number;    // 700
    extrabold: number; // 800
    black: number;   // 900
  };
  
  // Line heights
  lineHeights: {
    tight: string;   // 1.25
    normal: string;  // 1.5
    relaxed: string; // 1.75
    loose: string;   // 2
  };
  
  // Letter spacing
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}
```

## Component Styling

### Component Configuration

```typescript
interface ComponentConfig {
  // Border radius
  borderRadius: {
    none: string;   // 0
    sm: string;     // 0.125rem
    base: string;   // 0.25rem
    md: string;     // 0.375rem
    lg: string;     // 0.5rem
    xl: string;     // 0.75rem
    '2xl': string;  // 1rem
    full: string;   // 9999px
  };
  
  // Shadows
  shadows: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  
  // Spacing scale
  spacing: {
    unit: number; // Base unit (8px)
    scale: {
      0: string;   // 0
      1: string;   // 0.25rem
      2: string;   // 0.5rem
      3: string;   // 0.75rem
      4: string;   // 1rem
      // ... continues
      96: string;  // 24rem
    };
  };
  
  // Component-specific overrides
  button: {
    borderRadius: string;
    padding: {
      sm: string;
      md: string;
      lg: string;
    };
    fontSize: {
      sm: string;
      md: string;
      lg: string;
    };
  };
  
  card: {
    borderRadius: string;
    padding: string;
    shadow: string;
  };
  
  input: {
    borderRadius: string;
    borderWidth: string;
    padding: string;
  };
  
  // ... other components
}
```

## Backend Implementation

### Branding Service

```typescript
@Injectable()
export class BrandingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBrandingConfig(
    organizationId: string,
    propertyId?: string
  ): Promise<BrandingConfig> {
    // Get property-specific branding first
    if (propertyId) {
      const propertyBranding = await this.prisma.brandingConfig.findUnique({
        where: {
          organizationId_propertyId: {
            organizationId,
            propertyId,
          },
        },
        include: {
          assets: true,
        },
      });

      if (propertyBranding?.status === 'ACTIVE') {
        return this.processBrandingConfig(propertyBranding);
      }
    }

    // Fallback to organization-level branding
    const orgBranding = await this.prisma.brandingConfig.findUnique({
      where: {
        organizationId_propertyId: {
          organizationId,
          propertyId: null,
        },
      },
      include: {
        assets: true,
      },
    });

    if (orgBranding?.status === 'ACTIVE') {
      return this.processBrandingConfig(orgBranding);
    }

    // Return default branding
    return this.getDefaultBranding();
  }

  async updateBrandingConfig(
    organizationId: string,
    propertyId: string | null,
    updateData: UpdateBrandingConfigDto,
    userId: string
  ): Promise<BrandingConfig> {
    // Save current config to history
    const current = await this.prisma.brandingConfig.findUnique({
      where: {
        organizationId_propertyId: {
          organizationId,
          propertyId,
        },
      },
    });

    if (current) {
      await this.saveBrandingHistory(current.id, updateData, userId);
    }

    // Update or create branding config
    const config = await this.prisma.brandingConfig.upsert({
      where: {
        organizationId_propertyId: {
          organizationId,
          propertyId,
        },
      },
      update: {
        ...updateData,
        updatedAt: new Date(),
        version: { increment: 1 },
      },
      create: {
        organizationId,
        propertyId,
        ...updateData,
        createdBy: userId,
      },
      include: {
        assets: true,
      },
    });

    return this.processBrandingConfig(config);
  }

  async uploadBrandingAsset(
    configId: string,
    assetType: AssetType,
    file: Express.Multer.File,
    userId: string
  ): Promise<BrandingAsset> {
    // Upload to R2 storage
    const filePath = await this.uploadToR2(file, 'branding');

    // Save asset record
    return this.prisma.brandingAsset.create({
      data: {
        brandingConfigId: configId,
        assetType,
        fileName: file.originalname,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userId,
      },
    });
  }

  private processBrandingConfig(config: any): BrandingConfig {
    return {
      id: config.id,
      colors: this.mergeWithDefaults(config.colors, defaultColors),
      typography: this.mergeWithDefaults(config.typography, defaultTypography),
      components: this.mergeWithDefaults(config.components, defaultComponents),
      customCSS: config.customCSS,
      assets: config.assets,
      // ... other processing
    };
  }

  private mergeWithDefaults(custom: any, defaults: any): any {
    return {
      ...defaults,
      ...custom,
    };
  }

  private async saveBrandingHistory(
    configId: string,
    changes: any,
    userId: string
  ): Promise<void> {
    await this.prisma.brandingHistory.create({
      data: {
        brandingConfigId: configId,
        colors: changes.colors,
        typography: changes.typography,
        components: changes.components,
        customCSS: changes.customCSS,
        changeDescription: this.generateChangeDescription(changes),
        changedBy: userId,
      },
    });
  }

  private generateChangeDescription(changes: any): string {
    const descriptions = [];
    
    if (changes.colors) descriptions.push('Updated color palette');
    if (changes.typography) descriptions.push('Updated typography');
    if (changes.components) descriptions.push('Updated component styles');
    if (changes.customCSS) descriptions.push('Updated custom CSS');
    
    return descriptions.join(', ');
  }
}
```

### Branding Controller

```typescript
@Controller('branding')
@UseGuards(JwtAuthGuard)
export class BrandingController extends TenantBaseController {
  constructor(private readonly brandingService: BrandingService) {
    super();
  }

  @Get()
  async getBranding(@Req() req: Request) {
    const { organizationId, propertyId } = this.getTenantContext(req);
    return this.brandingService.getBrandingConfig(organizationId, propertyId);
  }

  @Put()
  @UseGuards(RoleGuard(['ORG_ADMIN', 'PROPERTY_MANAGER']))
  async updateBranding(
    @Req() req: Request,
    @Body() updateBrandingDto: UpdateBrandingConfigDto
  ) {
    const { organizationId, propertyId, userId } = this.getTenantContext(req);
    return this.brandingService.updateBrandingConfig(
      organizationId,
      propertyId,
      updateBrandingDto,
      userId
    );
  }

  @Post('assets/upload')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(RoleGuard(['ORG_ADMIN', 'PROPERTY_MANAGER']))
  async uploadAsset(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadAssetDto: UploadAssetDto
  ) {
    const { userId } = this.getTenantContext(req);
    return this.brandingService.uploadBrandingAsset(
      uploadAssetDto.configId,
      uploadAssetDto.assetType,
      file,
      userId
    );
  }

  @Get('preview')
  async previewBranding(
    @Req() req: Request,
    @Query() previewDto: PreviewBrandingDto
  ) {
    // Generate preview with temporary branding
    return this.brandingService.generatePreview(previewDto);
  }

  @Post('publish')
  @UseGuards(RoleGuard(['ORG_ADMIN', 'PROPERTY_MANAGER']))
  async publishBranding(@Req() req: Request, @Body() publishDto: PublishBrandingDto) {
    const { organizationId, propertyId, userId } = this.getTenantContext(req);
    return this.brandingService.publishBranding(
      organizationId,
      propertyId,
      publishDto.configId,
      userId
    );
  }
}
```

## Frontend Implementation

### Theme Provider

```typescript
// Theme context and provider
interface ThemeContextType {
  branding: BrandingConfig | null;
  isLoading: boolean;
  updateBranding: (updates: Partial<BrandingConfig>) => Promise<void>;
  previewMode: boolean;
  setPreviewMode: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization, property } = useTenant();
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load branding configuration
  const { data: brandingData, isLoading: brandingLoading } = useQuery(
    ['branding', organization?.id, property?.id],
    () => brandingService.getBrandingConfig(organization!.id, property?.id),
    {
      enabled: !!organization?.id,
      onSuccess: (data) => {
        setBranding(data);
        applyBrandingToDOM(data);
      },
    }
  );

  useEffect(() => {
    setIsLoading(brandingLoading);
  }, [brandingLoading]);

  const updateBranding = useCallback(async (updates: Partial<BrandingConfig>) => {
    if (!organization) return;

    const updatedBranding = { ...branding, ...updates };
    setBranding(updatedBranding);
    
    if (previewMode) {
      // Apply preview immediately
      applyBrandingToDOM(updatedBranding);
    } else {
      // Save to backend
      await brandingService.updateBrandingConfig(
        organization.id,
        property?.id,
        updates
      );
    }
  }, [branding, organization, property, previewMode]);

  return (
    <ThemeContext.Provider
      value={{
        branding,
        isLoading,
        updateBranding,
        previewMode,
        setPreviewMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### CSS Variable Injection

```typescript
// Function to apply branding to DOM
function applyBrandingToDOM(branding: BrandingConfig): void {
  const root = document.documentElement;

  // Apply color variables
  if (branding.colors) {
    applyColorVariables(root, branding.colors);
  }

  // Apply typography variables
  if (branding.typography) {
    applyTypographyVariables(root, branding.typography);
  }

  // Apply component variables
  if (branding.components) {
    applyComponentVariables(root, branding.components);
  }

  // Apply custom CSS
  if (branding.customCSS) {
    applyCustomCSS(branding.customCSS);
  }

  // Load custom fonts
  if (branding.typography?.fontUrls) {
    loadCustomFonts(branding.typography.fontUrls);
  }
}

function applyColorVariables(root: HTMLElement, colors: ColorConfig): void {
  // Primary colors
  Object.entries(colors.primary).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });

  // Secondary colors
  Object.entries(colors.secondary).forEach(([shade, color]) => {
    root.style.setProperty(`--color-secondary-${shade}`, color);
  });

  // Semantic colors
  Object.entries(colors.semantic).forEach(([name, color]) => {
    root.style.setProperty(`--color-${name}`, color);
  });

  // Background colors
  Object.entries(colors.background).forEach(([name, color]) => {
    root.style.setProperty(`--color-background-${name}`, color);
  });

  // Text colors
  Object.entries(colors.text).forEach(([name, color]) => {
    root.style.setProperty(`--color-text-${name}`, color);
  });
}

function applyTypographyVariables(root: HTMLElement, typography: TypographyConfig): void {
  // Font families
  Object.entries(typography.fontFamilies).forEach(([name, family]) => {
    root.style.setProperty(`--font-family-${name}`, family);
  });

  // Font sizes
  Object.entries(typography.fontSizes).forEach(([size, value]) => {
    root.style.setProperty(`--font-size-${size}`, value);
  });

  // Font weights
  Object.entries(typography.fontWeights).forEach(([weight, value]) => {
    root.style.setProperty(`--font-weight-${weight}`, value.toString());
  });
}

function applyComponentVariables(root: HTMLElement, components: ComponentConfig): void {
  // Border radius
  Object.entries(components.borderRadius).forEach(([size, value]) => {
    root.style.setProperty(`--border-radius-${size}`, value);
  });

  // Shadows
  Object.entries(components.shadows).forEach(([size, value]) => {
    root.style.setProperty(`--shadow-${size}`, value);
  });

  // Spacing
  Object.entries(components.spacing.scale).forEach(([size, value]) => {
    root.style.setProperty(`--spacing-${size}`, value);
  });
}

function applyCustomCSS(customCSS: string): void {
  // Remove existing custom styles
  const existingCustomStyle = document.getElementById('custom-branding-css');
  if (existingCustomStyle) {
    existingCustomStyle.remove();
  }

  // Add new custom styles
  const style = document.createElement('style');
  style.id = 'custom-branding-css';
  style.textContent = customCSS;
  document.head.appendChild(style);
}

function loadCustomFonts(fontUrls: string[]): void {
  fontUrls.forEach(url => {
    // Check if font is already loaded
    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  });
}
```

### Brand Studio Interface

```typescript
// Brand studio component for customizing branding
export const BrandStudio: React.FC = () => {
  const { branding, updateBranding, previewMode, setPreviewMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'components' | 'advanced'>('colors');

  return (
    <div className="brand-studio">
      <div className="brand-studio-header">
        <h1>Brand Studio</h1>
        <div className="brand-studio-actions">
          <Button
            variant={previewMode ? 'default' : 'outline'}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Exit Preview' : 'Preview Mode'}
          </Button>
          <Button onClick={() => saveBranding()}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="brand-studio-content">
        <div className="brand-studio-sidebar">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="brand-studio-editor">
          <TabsContent value="colors">
            <ColorEditor
              colors={branding?.colors}
              onUpdate={(colors) => updateBranding({ colors })}
            />
          </TabsContent>

          <TabsContent value="typography">
            <TypographyEditor
              typography={branding?.typography}
              onUpdate={(typography) => updateBranding({ typography })}
            />
          </TabsContent>

          <TabsContent value="components">
            <ComponentEditor
              components={branding?.components}
              onUpdate={(components) => updateBranding({ components })}
            />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedEditor
              customCSS={branding?.customCSS}
              onUpdate={(customCSS) => updateBranding({ customCSS })}
            />
          </TabsContent>
        </div>

        <div className="brand-studio-preview">
          <BrandPreview branding={branding} />
        </div>
      </div>
    </div>
  );
};
```

### Color Editor Component

```typescript
export const ColorEditor: React.FC<{
  colors?: ColorConfig;
  onUpdate: (colors: ColorConfig) => void;
}> = ({ colors, onUpdate }) => {
  const handleColorChange = (path: string, color: string) => {
    const updatedColors = { ...colors };
    setNestedProperty(updatedColors, path, color);
    onUpdate(updatedColors);
  };

  return (
    <div className="color-editor">
      <div className="color-section">
        <h3>Primary Colors</h3>
        <ColorPalette
          colors={colors?.primary}
          onChange={(shade, color) => handleColorChange(`primary.${shade}`, color)}
        />
      </div>

      <div className="color-section">
        <h3>Secondary Colors</h3>
        <ColorPalette
          colors={colors?.secondary}
          onChange={(shade, color) => handleColorChange(`secondary.${shade}`, color)}
        />
      </div>

      <div className="color-section">
        <h3>Semantic Colors</h3>
        <div className="color-grid">
          {Object.entries(colors?.semantic || {}).map(([name, color]) => (
            <ColorPicker
              key={name}
              label={name}
              color={color}
              onChange={(newColor) => handleColorChange(`semantic.${name}`, newColor)}
            />
          ))}
        </div>
      </div>

      <div className="color-section">
        <h3>AI Color Suggestions</h3>
        <AIColorSuggestions
          baseColor={colors?.primary?.[500]}
          onApply={(suggestion) => onUpdate(suggestion)}
        />
      </div>
    </div>
  );
};
```

## Advanced Features

### AI-Powered Color Generation

```typescript
// AI color suggestion service
export class AIColorService {
  async generateColorPalette(
    baseColor: string,
    mood: 'professional' | 'warm' | 'modern' | 'luxurious'
  ): Promise<ColorConfig> {
    // Use AI service to generate harmonious color palette
    const response = await openai.createCompletion({
      model: 'gpt-4',
      prompt: `Generate a complete hotel brand color palette based on the primary color ${baseColor} with a ${mood} mood. Return as JSON with primary, secondary, accent, semantic, neutral, background, text, and border colors in the specified format.`,
      max_tokens: 1000,
    });

    return JSON.parse(response.data.choices[0].text);
  }

  async suggestBrandColors(industryType: string, brandPersonality: string[]): Promise<ColorConfig[]> {
    // Generate multiple color suggestions based on industry and brand personality
    // Return array of complete color configurations
  }
}
```

### Accessibility Compliance

```typescript
// Accessibility checker for color combinations
export class AccessibilityChecker {
  checkColorContrast(foreground: string, background: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  } {
    const ratio = this.calculateContrastRatio(foreground, background);
    
    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
    };
  }

  validateBrandingAccessibility(branding: BrandingConfig): AccessibilityReport {
    const issues = [];
    
    // Check text on background combinations
    const textBgCombinations = [
      { text: branding.colors.text.primary, bg: branding.colors.background.primary },
      { text: branding.colors.text.secondary, bg: branding.colors.background.secondary },
      // ... other combinations
    ];

    textBgCombinations.forEach(({ text, bg }, index) => {
      const contrast = this.checkColorContrast(text, bg);
      if (!contrast.wcagAA) {
        issues.push({
          type: 'contrast',
          severity: 'error',
          message: `Text color combination ${index + 1} does not meet WCAG AA standards`,
          suggestion: this.suggestBetterContrast(text, bg),
        });
      }
    });

    return { issues, score: this.calculateAccessibilityScore(issues) };
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Implement WCAG contrast ratio calculation
    const lum1 = this.relativeLuminance(color1);
    const lum2 = this.relativeLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
}
```

### Brand Asset Management

```typescript
// Brand asset manager
export const BrandAssetManager: React.FC = () => {
  const [assets, setAssets] = useState<BrandingAsset[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleAssetUpload = async (file: File, assetType: AssetType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);

    try {
      const response = await brandingService.uploadAsset(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(progress);
        },
      });

      setAssets([...assets, response]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Asset upload failed:', error);
    }
  };

  return (
    <div className="brand-asset-manager">
      <div className="asset-upload-zone">
        <FileDropzone
          accept="image/*"
          onDrop={(files) => handleAssetUpload(files[0], 'LOGO_LIGHT')}
        >
          <div className="upload-instructions">
            <Upload className="w-12 h-12 mx-auto mb-4" />
            <p>Drop your brand assets here or click to upload</p>
            <p className="text-sm text-gray-500">
              Supports PNG, JPG, SVG up to 10MB
            </p>
          </div>
        </FileDropzone>
        {uploadProgress > 0 && (
          <Progress value={uploadProgress} className="mt-4" />
        )}
      </div>

      <div className="asset-grid">
        {assets.map((asset) => (
          <AssetPreview
            key={asset.id}
            asset={asset}
            onDelete={() => deleteAsset(asset.id)}
            onReplace={(file) => replaceAsset(asset.id, file)}
          />
        ))}
      </div>
    </div>
  );
};
```

This comprehensive white-labeling system allows Hotel Operations Hub to provide complete brand customization while maintaining performance, accessibility, and ease of use.