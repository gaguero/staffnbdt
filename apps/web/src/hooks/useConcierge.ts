import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import conciergeService from '../services/conciergeService';
import {
  ConciergeObjectFilter,
  CreateConciergeObjectInput,
  UpdateConciergeObjectInput,
  ExecutePlaybookInput,
  conciergeQueryKeys,
} from '../types/concierge';
import { useTenant } from '../contexts/TenantContext';

// Concierge Objects Hooks
export const useConciergeObjects = (filter?: ConciergeObjectFilter) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...conciergeQueryKeys.objects.list(filter), tenantKey],
    queryFn: () => conciergeService.getObjects(filter),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    staleTime: 15000, // Consider data stale after 15 seconds
  });
};

export const useConciergeObject = (id: string) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...conciergeQueryKeys.objects.detail(id), tenantKey],
    queryFn: () => conciergeService.getObject(id),
    enabled: !!id,
  });
};

export const useCreateConciergeObject = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: (input: CreateConciergeObjectInput) => conciergeService.createObject(input),
    onSuccess: (_data) => {
      // Invalidate and refetch objects list
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.all, tenantKey]
      });
      // Invalidate today board
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.todayBoard(), tenantKey]
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.stats(), tenantKey]
      });
      toast.success('Concierge object created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create concierge object');
    },
  });
};

export const useUpdateConciergeObject = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateConciergeObjectInput }) => 
      conciergeService.updateObject(id, input),
    onSuccess: (data, variables) => {
      // Update the specific object in cache
      queryClient.setQueryData(
        [...conciergeQueryKeys.objects.detail(variables.id), tenantKey],
        { data: data.data, success: true }
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.lists(), tenantKey]
      });
      // Invalidate today board
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.todayBoard(), tenantKey]
      });
      toast.success('Concierge object updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update concierge object');
    },
  });
};

export const useDeleteConciergeObject = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: (id: string) => conciergeService.deleteObject(id),
    onSuccess: () => {
      // Invalidate all object queries
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.all, tenantKey]
      });
      // Invalidate today board
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.todayBoard(), tenantKey]
      });
      toast.success('Concierge object deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete concierge object');
    },
  });
};

export const useCompleteConciergeObject = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      conciergeService.completeObject(id, notes),
    onSuccess: (data, variables) => {
      // Update the specific object in cache
      queryClient.setQueryData(
        [...conciergeQueryKeys.objects.detail(variables.id), tenantKey],
        { data: data.data, success: true }
      );
      // Invalidate lists and views
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.lists(), tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.todayBoard(), tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.stats(), tenantKey]
      });
      toast.success('Concierge object completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete concierge object');
    },
  });
};

export const useAssignConciergeObject = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => 
      conciergeService.assignObject(id, userId),
    onSuccess: (data, variables) => {
      // Update the specific object in cache
      queryClient.setQueryData(
        [...conciergeQueryKeys.objects.detail(variables.id), tenantKey],
        { data: data.data, success: true }
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.lists(), tenantKey]
      });
      toast.success('Concierge object assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign concierge object');
    },
  });
};

// Object Types Hooks
export const useObjectTypes = () => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...conciergeQueryKeys.objectTypes.lists(), tenantKey],
    queryFn: () => conciergeService.getObjectTypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Playbooks Hooks
export const usePlaybooks = () => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...conciergeQueryKeys.playbooks.lists(), tenantKey],
    queryFn: () => conciergeService.getPlaybooks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useExecutePlaybook = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: (input: ExecutePlaybookInput) => conciergeService.executePlaybook(input),
    onSuccess: () => {
      // Invalidate objects since playbook might create new ones
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.all, tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.todayBoard(), tenantKey]
      });
      toast.success('Playbook executed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to execute playbook');
    },
  });
};

// View-Specific Hooks
export const useTodayBoard = () => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...conciergeQueryKeys.todayBoard(), tenantKey],
    queryFn: () => conciergeService.getTodayBoard(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
};

export const useReservationChecklist = (reservationId: string) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...conciergeQueryKeys.reservationChecklist(reservationId), tenantKey],
    queryFn: () => conciergeService.getReservationChecklist(reservationId),
    enabled: !!reservationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useGuestTimeline = (guestId: string) => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...conciergeQueryKeys.guestTimeline(guestId), tenantKey],
    queryFn: () => conciergeService.getGuestTimeline(guestId),
    enabled: !!guestId,
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useConciergeStats = () => {
  const { tenantKey } = useTenant();
  
  return useQuery({
    queryKey: [...conciergeQueryKeys.stats(), tenantKey],
    queryFn: () => conciergeService.getStats(),
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    staleTime: 60 * 1000, // Consider stale after 1 minute
  });
};

// Bulk Operations Hooks
export const useBulkUpdateStatus = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ objectIds, status }: { objectIds: string[]; status: string }) => 
      conciergeService.bulkUpdateStatus(objectIds, status),
    onSuccess: () => {
      // Invalidate all object queries
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.all, tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.todayBoard(), tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.stats(), tenantKey]
      });
      toast.success('Objects updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update objects');
    },
  });
};

export const useBulkAssign = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ objectIds, userId }: { objectIds: string[]; userId: string }) => 
      conciergeService.bulkAssign(objectIds, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.all, tenantKey]
      });
      toast.success('Objects assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign objects');
    },
  });
};

export const useBulkComplete = () => {
  const queryClient = useQueryClient();
  const { tenantKey } = useTenant();
  
  return useMutation({
    mutationFn: ({ objectIds, notes }: { objectIds: string[]; notes?: string }) => 
      conciergeService.bulkComplete(objectIds, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.objects.all, tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.todayBoard(), tenantKey]
      });
      queryClient.invalidateQueries({
        queryKey: [...conciergeQueryKeys.stats(), tenantKey]
      });
      toast.success('Objects completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete objects');
    },
  });
};
