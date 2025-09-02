import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { usePermissions } from '../hooks/usePermissions';
import { organizationService, Organization } from '../services/organizationService';
import { COMMON_PERMISSIONS } from '../types/permission';

interface OrganizationSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'compact';
}

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ className, variant = 'dropdown' }) => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { organizationId, setAdminOverride } = useTenant();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user can view organizations (Platform Admin)
  const canViewOrganizations = useMemo(() => {
    if (!user) {
      console.log('OrganizationSelector: No user, access denied');
      return false;
    }
    
    console.log('OrganizationSelector: Checking permissions for user:', user.role);
    
    // Platform Admin should always have access - simplified logic
    if (user.role === 'PLATFORM_ADMIN') {
      console.log('OrganizationSelector: Platform Admin access granted');
      return true;
    }
    
    // Try the platform-specific permission
    console.log('OrganizationSelector: Checking organization.read.platform permission');
    const hasPlatformPermission = hasPermission('organization', 'read', 'platform');
    console.log('OrganizationSelector: Platform permission result:', hasPlatformPermission);
    if (hasPlatformPermission) return true;
    
    // Try the 'all' scope permission as fallback
    console.log('OrganizationSelector: Checking organization.read.all permission');
    const hasAllPermission = hasPermission('organization', 'read', 'all');
    console.log('OrganizationSelector: All permission result:', hasAllPermission);
    if (hasAllPermission) return true;
    
    // Final fallback to common permissions
    console.log('OrganizationSelector: Checking common permission:', COMMON_PERMISSIONS.VIEW_ORGANIZATIONS);
    const hasCommonPermission = hasPermission(
      COMMON_PERMISSIONS.VIEW_ORGANIZATIONS.resource,
      COMMON_PERMISSIONS.VIEW_ORGANIZATIONS.action,
      COMMON_PERMISSIONS.VIEW_ORGANIZATIONS.scope
    );
    console.log('OrganizationSelector: Common permission result:', hasCommonPermission);
    return hasCommonPermission;
  }, [user, hasPermission]);

  // Load organizations list for authorized users only
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!canViewOrganizations) return;
      setLoading(true);
      setError(null);
      try {
        console.log('OrganizationSelector: Loading organizations for user:', user?.role);
        // Avoid backend 500s with unsupported params; fetch with default pagination
        const resp = await organizationService.getOrganizations();
        console.log('OrganizationSelector: Raw response:', resp);
        console.log('OrganizationSelector: Response structure:', {
          hasData: !!resp.data,
          dataType: typeof resp.data,
          isArray: Array.isArray(resp.data),
          hasNestedData: !!(resp.data && resp.data.data),
          nestedDataType: resp.data && typeof resp.data.data
        });
        
        let data = [];
        if (Array.isArray(resp.data)) {
          data = resp.data;
        } else if (resp.data && Array.isArray(resp.data.data)) {
          data = resp.data.data;
        } else if (resp.data && resp.data.data && Array.isArray(resp.data.data.data)) {
          data = resp.data.data.data;
        }
        
        console.log('OrganizationSelector: Processed data:', data);
        console.log('OrganizationSelector: Organization count:', data.length);
        if (mounted) {
          setOrganizations(data);
        }
      } catch (e: any) {
        console.error('OrganizationSelector: Error loading organizations:', e);
        if (mounted) setError(e?.message || 'Failed to load organizations');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [canViewOrganizations]);

  const currentName = useMemo(() => {
    const found = organizations.find(o => o.id === organizationId);
    return found?.name || 'Select Organization';
  }, [organizations, organizationId]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrgId = e.target.value || undefined;
    // Single-phase: set organization and clear property, then reload. PropertySelector will handle property selection.
    setAdminOverride(newOrgId, undefined, 'platform-admin');
    window.location.reload();
  };

  if (!canViewOrganizations) return null;

  if (variant === 'compact') {
    return (
      <div className={className}>
        <label className="block text-xs text-gray-500 mb-1">Organization</label>
        <select
          value={organizationId || ''}
          onChange={handleChange}
          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          disabled={loading || !!error}
        >
          <option value="">Select Organization</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Organization</span>
        {loading && <span className="text-[10px] text-gray-400">Loading…</span>}
      </div>
      {error ? (
        <div className="text-xs text-red-600">{error}</div>
      ) : (
        <select
          value={organizationId || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          disabled={loading}
        >
          <option value="">Select Organization</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      )}
      <div className="mt-1 text-[11px] text-gray-400">Current: {currentName}</div>
    </div>
  );
};

export default OrganizationSelector;


