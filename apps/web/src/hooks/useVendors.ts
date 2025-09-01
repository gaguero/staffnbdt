import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { vendorsService } from '../services/vendorsService';
import {
  VendorFilter,
  VendorLinkFilter,
  CreateVendorInput,
  UpdateVendorInput,
  CreateVendorLinkInput,
  ConfirmVendorLinkInput,
  GenerateMagicLinkInput,
  vendorsQueryKeys,
} from '../types/vendors';
import { useTenant } from '../contexts/TenantContext';

// Vendors Hooks
export const useVendors = (filter?: VendorFilter) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...vendorsQueryKeys.vendors.list(filter), tenantKey],
    queryFn: () => vendorsService.getVendors(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useVendor = (id: string) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...vendorsQueryKeys.vendors.detail(id), tenantKey],
    queryFn: () => vendorsService.getVendor(id),
    enabled: !!id,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: (input: CreateVendorInput) => vendorsService.createVendor(input),
    onSuccess: (_data) => {
      // Invalidate vendors list
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.vendors.all, tenantKey]
      });
      // Invalidate directory
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.directory(), tenantKey]
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.stats(), tenantKey]
      });
      toast.success('Vendor created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create vendor');
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVendorInput }) => 
      vendorsService.updateVendor(id, input),
    onSuccess: (_data, _variables) => {
      // Update the specific vendor in cache
      queryClient.setQueryData(
        [...vendorsQueryKeys.vendors.detail(_variables.id), tenantKey],
        { data: _data.data, success: true }
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.vendors.lists(), tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.directory(), tenantKey]
      });
      toast.success('Vendor updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update vendor');
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: (id: string) => vendorsService.deleteVendor(id),
    onSuccess: () => {
      // Invalidate all vendor queries
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.vendors.all, tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.directory(), tenantKey]
      });
      toast.success('Vendor deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete vendor');
    },
  });
};

export const useToggleVendorStatus = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: (id: string) => vendorsService.toggleVendorStatus(id),
    onSuccess: (_data, _variables) => {
      // Update the specific vendor in cache
      queryClient.setQueryData(
        [...vendorsQueryKeys.vendors.detail(_variables), tenantKey],
        { data: _data.data, success: true }
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.vendors.lists(), tenantKey]
      });
      toast.success(`Vendor ${_data.data.isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to toggle vendor status');
    },
  });
};

// Vendor Links Hooks
export const useVendorLinks = (filter?: VendorLinkFilter) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...vendorsQueryKeys.links.list(filter), tenantKey],
    queryFn: () => vendorsService.getVendorLinks(filter),
    refetchInterval: 60000, // Refresh every minute for real-time status
    staleTime: 30000, // Consider stale after 30 seconds
  });
};

export const useVendorLink = (id: string) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...vendorsQueryKeys.links.detail(id), tenantKey],
    queryFn: () => vendorsService.getVendorLink(id),
    enabled: !!id,
  });
};

export const useCreateVendorLink = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: (input: CreateVendorLinkInput) => vendorsService.createVendorLink(input),
    onSuccess: (_data) => {
      // Invalidate links list
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.all, tenantKey]
      });
      // Invalidate vendor details (to update links)
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.vendors.detail(_data.data.vendorId), tenantKey]
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.stats(), tenantKey]
      });
      toast.success('Vendor link created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create vendor link');
    },
  });
};

export const useConfirmVendorLink = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ linkId, input }: { linkId: string; input: ConfirmVendorLinkInput }) => 
      vendorsService.confirmVendorLink(linkId, input),
    onSuccess: (_data, _variables) => {
      // Update the specific link in cache
      queryClient.setQueryData(
        [...vendorsQueryKeys.links.detail(_variables.linkId), tenantKey],
        { data: _data.data, success: true }
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.lists(), tenantKey]
      });
      // Invalidate tracking
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.tracking(_variables.linkId), tenantKey]
      });
      toast.success(`Link ${_data.data.status === 'confirmed' ? 'confirmed' : 'declined'} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update link status');
    },
  });
};

export const useCancelVendorLink = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ linkId, reason }: { linkId: string; reason?: string }) => 
      vendorsService.cancelVendorLink(linkId, reason),
    onSuccess: (_data, _variables) => {
      // Update the specific link in cache
      queryClient.setQueryData(
        [...vendorsQueryKeys.links.detail(_variables.linkId), tenantKey],
        { data: _data.data, success: true }
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.lists(), tenantKey]
      });
      toast.success('Vendor link cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel vendor link');
    },
  });
};

// Magic Link Hooks
export const useGenerateMagicLink = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: (input: GenerateMagicLinkInput) => vendorsService.generateMagicLink(input),
    onSuccess: (_data, _variables) => {
      // Invalidate link details to show updated portal token
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.detail(_variables.linkId), tenantKey]
      });
      // Invalidate tracking
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.tracking(_variables.linkId), tenantKey]
      });
      toast.success('Magic link generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate magic link');
    },
  });
};

export const useValidatePortalToken = (token: string) => {
  return useQuery({
    queryKey: [...vendorsQueryKeys.portal.session(token)],
    queryFn: () => vendorsService.validatePortalToken(token),
    enabled: !!token,
    retry: false, // Don't retry on failed token validation
    staleTime: 0, // Always fresh for security
  });
};

export const useVendorPortalData = (token: string) => {
  return useQuery({
    queryKey: [...vendorsQueryKeys.portal.session(token), 'data'],
    queryFn: () => vendorsService.getPortalData(token),
    enabled: !!token,
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Directory and Tracking Hooks
export const useVendorDirectory = () => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...vendorsQueryKeys.directory(), tenantKey],
    queryFn: () => vendorsService.getVendorDirectory(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useVendorLinkTracking = (linkId: string) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...vendorsQueryKeys.links.tracking(linkId), tenantKey],
    queryFn: () => vendorsService.getVendorLinkTracking(linkId),
    enabled: !!linkId,
    refetchInterval: 60000, // Refresh every minute
  });
};

// Notifications Hooks
export const useVendorNotifications = (linkId: string) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...vendorsQueryKeys.links.detail(linkId), 'notifications', tenantKey],
    queryFn: () => vendorsService.getVendorNotifications(linkId),
    enabled: !!linkId,
  });
};

export const useSendNotification = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ linkId, channels }: { linkId: string; channels: string[] }) => 
      vendorsService.sendNotification(linkId, channels),
    onSuccess: (_data, _variables) => {
      // Invalidate notifications
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.detail(_variables.linkId), 'notifications', tenantKey]
      });
      // Invalidate tracking
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.tracking(_variables.linkId), tenantKey]
      });
      toast.success('Notification sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send notification');
    },
  });
};

// Statistics Hook
export const useVendorStats = () => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...vendorsQueryKeys.stats(), tenantKey],
    queryFn: () => vendorsService.getVendorStats(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });
};

// Search and Suggestions Hooks
export const useSearchVendors = () => {
  return useMutation({
    mutationFn: ({ query, category }: { query: string; category?: string }) => 
      vendorsService.searchVendors(query, category),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to search vendors');
    },
  });
};

export const useVendorSuggestions = (objectType: string, metadata?: Record<string, any>) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: ['vendorSuggestions', objectType, metadata, tenantKey],
    queryFn: () => vendorsService.getVendorSuggestions(objectType, metadata),
    enabled: !!objectType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Bulk Operations Hooks
export const useBulkUpdateVendors = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ vendorIds, updates }: { vendorIds: string[]; updates: Partial<UpdateVendorInput> }) => 
      vendorsService.bulkUpdateVendors(vendorIds, updates),
    onSuccess: () => {
      // Invalidate all vendor queries
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.vendors.all, tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.directory(), tenantKey]
      });
      toast.success('Vendors updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update vendors');
    },
  });
};

export const useBulkNotifyLinks = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ linkIds, channels }: { linkIds: string[]; channels: string[] }) => 
      vendorsService.bulkNotifyLinks(linkIds, channels),
    onSuccess: () => {
      // Invalidate links queries
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.all, tenantKey]
      });
      toast.success('Notifications sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send notifications');
    },
  });
};

export const useBulkCancelLinks = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ linkIds, reason }: { linkIds: string[]; reason?: string }) => 
      vendorsService.bulkCancelLinks(linkIds, reason),
    onSuccess: () => {
      // Invalidate links queries
      queryClient.invalidateQueries({
        queryKey: [...vendorsQueryKeys.links.all, tenantKey]
      });
      toast.success('Links cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel links');
    },
  });
};
