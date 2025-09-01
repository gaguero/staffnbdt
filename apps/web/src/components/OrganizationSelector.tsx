import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { usePermissions } from '../hooks/usePermissions';
import { organizationService, Organization } from '../services/organizationService';

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

  // Load organizations list for platform admins only
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user || !hasPermission('organization', 'manage', 'platform')) return;
      setLoading(true);
      setError(null);
      try {
        // Avoid backend 500s with unsupported params; fetch with default pagination
        const resp = await organizationService.getOrganizations();
        const data = Array.isArray((resp as any)?.data) ? (resp as any).data : [];
        if (mounted) {
          setOrganizations(data);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load organizations');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user]);

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

  if (!user || !hasPermission('organization', 'manage', 'platform')) return null;

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


