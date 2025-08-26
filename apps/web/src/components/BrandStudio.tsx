import React, { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTenant } from '../contexts/TenantContext';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  
  const predefinedColors = [
    '#AA8E67', '#7C8E67', '#A4C4C8', '#E63946', '#F77F00', 
    '#FCBF49', '#2A9D8F', '#264653', '#6A4C93', '#F72585',
    '#4361EE', '#3F37C9', '#7209B7', '#A663CC', '#4CC9F0'
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 rounded-md border border-gray-300 flex items-center px-3 space-x-2 hover:border-gray-400 transition-colors disabled:opacity-50"
        >
          <div 
            className="w-6 h-6 rounded border border-gray-300" 
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-gray-700">{color}</span>
        </button>
        
        {isOpen && (
          <div className="absolute top-12 left-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-64">
            <div className="space-y-3">
              {/* Color input */}
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="#000000"
                />
              </div>
              
              {/* Predefined colors */}
              <div className="grid grid-cols-5 gap-2">
                {predefinedColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setTempColor(presetColor)}
                    className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setTempColor(color);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(tempColor);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface FontSelectorProps {
  font: string;
  onChange: (font: string) => void;
  label: string;
}

const FontSelector: React.FC<FontSelectorProps> = ({ font, onChange, label }) => {
  const fontOptions = [
    { name: 'Gotham Black', value: "'Gotham Black', 'Tahoma', 'Arial', sans-serif" },
    { name: 'Inter', value: "'Inter', sans-serif" },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'Open Sans', value: "'Open Sans', sans-serif" },
    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { name: 'Lato', value: "'Lato', sans-serif" },
    { name: 'Poppins', value: "'Poppins', sans-serif" },
    { name: 'Source Sans Pro', value: "'Source Sans Pro', sans-serif" },
    { name: 'Nunito', value: "'Nunito', sans-serif" },
    { name: 'Georgia', value: "'Georgia', serif" },
    { name: 'Times New Roman', value: "'Times New Roman', serif" },
    { name: 'Playfair Display', value: "'Playfair Display', serif" }
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={font}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {fontOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

interface LogoUploaderProps {
  currentLogo?: string;
  onLogoChange: (logoUrl: string) => void;
  label: string;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ currentLogo, onLogoChange, label }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    
    try {
      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append('logo', file);

      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/branding/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { logoUrl } = await response.json();
      onLogoChange(logoUrl);
    } catch (error) {
      console.error('Logo upload failed:', error);
      // For demo purposes, create a data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onLogoChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-4">
        {currentLogo && (
          <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            <img 
              src={currentLogo} 
              alt="Current logo" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Select Logo'}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG up to 2MB. Recommended: 200x60px
          </p>
        </div>
      </div>
    </div>
  );
};

const BrandStudio: React.FC = () => {
  const { brandConfig, applyTheme, resetToDefault, isCustomTheme, exportTheme, importTheme } = useTheme();
  const { organization, property } = useTenant();
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'assets' | 'preview'>('colors');
  const [localConfig, setLocalConfig] = useState(brandConfig);
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'colors', label: 'Colors', icon: '🎨' },
    { id: 'typography', label: 'Typography', icon: '✏️' },
    { id: 'assets', label: 'Assets', icon: '📸' },
    { id: 'preview', label: 'Preview', icon: '👁️' }
  ] as const;

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...localConfig };
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setLocalConfig(newConfig);
  };

  const handleApplyChanges = () => {
    applyTheme(localConfig);
  };

  const handleSaveToTenant = async () => {
    setSaving(true);
    try {
      // Validate that we have the necessary context
      if (!property && !organization?.id) {
        throw new Error('No organization or property context found. Please refresh and try again.');
      }

      const endpoint = property 
        ? `/api/branding/properties/${property.id}`
        : `/api/branding/organizations/${organization.id}`;

      const payload = property 
        ? { branding: localConfig }
        : { branding: localConfig };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hotel_ops_token')}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save branding (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Branding saved successfully:', result);
      alert('Branding saved successfully!');
    } catch (error) {
      console.error('❌ Save failed:', error);
      alert(`Failed to save branding: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportTheme = () => {
    const themeJson = exportTheme();
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organization?.name || 'custom'}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const themeJson = e.target?.result as string;
          importTheme(themeJson);
          setLocalConfig(JSON.parse(themeJson));
        } catch (error) {
          alert('Invalid theme file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Brand Studio</h2>
            <p className="text-sm text-gray-600 mt-1">
              Customize your {property ? 'property' : 'organization'} branding and theme
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {isCustomTheme && (
              <button
                onClick={resetToDefault}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Reset to Default
              </button>
            )}
            
            <button
              onClick={handleExportTheme}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-md"
            >
              Export Theme
            </button>
            
            <button
              onClick={handleImportTheme}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-md"
            >
              Import Theme
            </button>
            
            <button
              onClick={handleApplyChanges}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Preview
            </button>
            
            <button
              onClick={handleSaveToTenant}
              disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'colors' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Brand Colors</h3>
              
              <ColorPicker
                color={localConfig.colors.primary}
                onChange={(color) => updateConfig('colors.primary', color)}
                label="Primary Brand Color"
              />
              
              <ColorPicker
                color={localConfig.colors.secondary || '#7C8E67'}
                onChange={(color) => updateConfig('colors.secondary', color)}
                label="Secondary Color"
              />
              
              <ColorPicker
                color={localConfig.colors.accent || '#A4C4C8'}
                onChange={(color) => updateConfig('colors.accent', color)}
                label="Accent Color"
              />
              
              <ColorPicker
                color={localConfig.colors.background}
                onChange={(color) => updateConfig('colors.background', color)}
                label="Background Color"
              />
              
              <ColorPicker
                color={localConfig.colors.textPrimary}
                onChange={(color) => updateConfig('colors.textPrimary', color)}
                label="Primary Text Color"
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Color Preview</h3>
              <div 
                className="p-6 rounded-lg border"
                style={{ backgroundColor: localConfig.colors.background }}
              >
                <div 
                  className="bg-white p-4 rounded-lg shadow-sm"
                  style={{ backgroundColor: localConfig.colors.surface }}
                >
                  <h4 
                    className="text-lg font-semibold mb-2"
                    style={{ color: localConfig.colors.textPrimary }}
                  >
                    Sample Card
                  </h4>
                  <p 
                    className="text-sm mb-3"
                    style={{ color: localConfig.colors.textSecondary }}
                  >
                    This is how your content will look with the selected colors.
                  </p>
                  <button
                    className="px-4 py-2 rounded text-white text-sm font-medium"
                    style={{ backgroundColor: localConfig.colors.primary }}
                  >
                    Primary Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
              
              <FontSelector
                font={localConfig.typography.heading}
                onChange={(font) => updateConfig('typography.heading', font)}
                label="Heading Font"
              />
              
              <FontSelector
                font={localConfig.typography.subheading}
                onChange={(font) => updateConfig('typography.subheading', font)}
                label="Subheading Font"
              />
              
              <FontSelector
                font={localConfig.typography.body}
                onChange={(font) => updateConfig('typography.body', font)}
                label="Body Font"
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Typography Preview</h3>
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <h1 
                  className="text-3xl font-bold"
                  style={{ fontFamily: localConfig.typography.heading, color: localConfig.colors.textPrimary }}
                >
                  Heading 1 Sample
                </h1>
                <h2 
                  className="text-xl font-semibold"
                  style={{ fontFamily: localConfig.typography.subheading, color: localConfig.colors.textPrimary }}
                >
                  Subheading Sample
                </h2>
                <p 
                  className="text-base"
                  style={{ fontFamily: localConfig.typography.body, color: localConfig.colors.textSecondary }}
                >
                  This is how your body text will appear with the selected typography. The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Brand Assets</h3>
              
              <LogoUploader
                currentLogo={localConfig.assets.logoUrl}
                onLogoChange={(logoUrl) => updateConfig('assets.logoUrl', logoUrl)}
                label="Primary Logo (Light Backgrounds)"
              />
              
              <LogoUploader
                currentLogo={localConfig.assets.logoDarkUrl}
                onLogoChange={(logoUrl) => updateConfig('assets.logoDarkUrl', logoUrl)}
                label="Logo for Dark Backgrounds"
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Logo Preview</h3>
              
              {/* Light background preview */}
              <div className="p-6 bg-white border rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Light Background</p>
                {localConfig.assets.logoUrl ? (
                  <img 
                    src={localConfig.assets.logoUrl} 
                    alt="Logo on light background"
                    className="h-12 object-contain"
                  />
                ) : (
                  <div className="h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                    No logo uploaded
                  </div>
                )}
              </div>
              
              {/* Dark background preview */}
              <div 
                className="p-6 rounded-lg"
                style={{ backgroundColor: localConfig.colors.textPrimary }}
              >
                <p className="text-sm text-white mb-2">Dark Background</p>
                {localConfig.assets.logoDarkUrl || localConfig.assets.logoUrl ? (
                  <img 
                    src={localConfig.assets.logoDarkUrl || localConfig.assets.logoUrl} 
                    alt="Logo on dark background"
                    className="h-12 object-contain"
                  />
                ) : (
                  <div className="h-12 bg-gray-600 rounded flex items-center justify-center text-gray-300 text-sm">
                    No logo uploaded
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
            
            {/* Mini application preview */}
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ backgroundColor: localConfig.colors.background }}
            >
              {/* Mock header */}
              <div 
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ backgroundColor: localConfig.colors.surface }}
              >
                <div className="flex items-center space-x-3">
                  {localConfig.assets.logoUrl ? (
                    <img 
                      src={localConfig.assets.logoUrl} 
                      alt="Logo preview"
                      className="h-8 object-contain"
                    />
                  ) : (
                    <div 
                      className="h-8 w-20 rounded flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: localConfig.colors.primary }}
                    >
                      LOGO
                    </div>
                  )}
                  <h1 
                    className="text-xl font-bold"
                    style={{ 
                      fontFamily: localConfig.typography.heading,
                      color: localConfig.colors.textPrimary 
                    }}
                  >
                    Dashboard
                  </h1>
                </div>
                
                <button
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: localConfig.colors.primary }}
                >
                  Sign Out
                </button>
              </div>
              
              {/* Mock content */}
              <div className="p-6 space-y-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: localConfig.colors.surface }}
                >
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ 
                      fontFamily: localConfig.typography.subheading,
                      color: localConfig.colors.textPrimary 
                    }}
                  >
                    Welcome Back!
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ 
                      fontFamily: localConfig.typography.body,
                      color: localConfig.colors.textSecondary 
                    }}
                  >
                    This is how your application will look with the customized branding.
                  </p>
                  
                  <div className="flex space-x-3 mt-4">
                    <button
                      className="px-4 py-2 rounded text-white text-sm font-medium"
                      style={{ backgroundColor: localConfig.colors.primary }}
                    >
                      Primary Action
                    </button>
                    <button
                      className="px-4 py-2 rounded text-sm font-medium border"
                      style={{ 
                        borderColor: localConfig.colors.primary,
                        color: localConfig.colors.primary 
                      }}
                    >
                      Secondary Action
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Metric 1', 'Metric 2', 'Metric 3'].map((metric, index) => (
                    <div 
                      key={metric}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: localConfig.colors.surface }}
                    >
                      <h4 
                        className="text-sm font-medium"
                        style={{ color: localConfig.colors.textSecondary }}
                      >
                        {metric}
                      </h4>
                      <p 
                        className="text-2xl font-bold mt-1"
                        style={{ color: localConfig.colors.textPrimary }}
                      >
                        {(index + 1) * 123}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandStudio;