import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { usePermissions } from '../hooks/usePermissions';
import { organizationService, Organization } from '../services/organizationService';
import { COMMON_PERMISSIONS } from '../types/permission';

// Helper function to parse string-based permission into components
const parsePermissionString = (permissionString: string) => {
  const parts = permissionString.split('.');
  if (parts.length >= 3) {
    return {
      resource: parts[0],
      action: parts[1],
      scope: parts[2]
    };
  }
  return null;
};

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
    
    // Platform Admin should have access
    if (user.role === 'PLATFORM_ADMIN') {
      console.log('OrganizationSelector: Platform Admin access granted');
      return true;
    }
    
    // Try the string-based permission first
    const orgReadPlatform = parsePermissionString('organization.read.platform');
    if (orgReadPlatform) {
      console.log('OrganizationSelector: Checking string permission:', orgReadPlatform);
      const hasStringPermission = hasPermission(
        orgReadPlatform.resource,
        orgReadPlatform.action,
        orgReadPlatform.scope
      );
      console.log('OrganizationSelector: String permission result:', hasStringPermission);
      if (hasStringPermission) return true;
    }
    
    // Fallback to common permissions for viewing organizations
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
        const data = Array.isArray((resp as any)?.data) ? (resp as any).data : [];
        console.log('OrganizationSelector: Processed data:', data);
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


