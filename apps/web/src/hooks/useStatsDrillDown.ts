import { useState, useCallback } from 'react';
import { StatCardData } from '../components/ClickableStatCard';

export interface DrillDownData {
  title: string;
  subtitle?: string;
  data: any[];
  filters?: Record<string, any>;
  originalStat: StatCardData;
  timestamp: string;
}

interface UseStatsDrillDownOptions {
  onNavigateToFiltered?: (filters: Record<string, any>) => void;
  onDataFetch?: (stat: StatCardData) => Promise<any[]>;
}

interface UseStatsDrillDownReturn {
  isDrillDownOpen: boolean;
  drillDownData: DrillDownData | null;
  isLoading: boolean;
  error: string | null;
  
  // Operations
  openDrillDown: (stat: StatCardData, data?: any[]) => Promise<void>;
  closeDrillDown: () => void;
  navigateToFilteredView: (filters?: Record<string, any>) => void;
  refreshDrillDownData: () => Promise<void>;
}

export const useStatsDrillDown = (options: UseStatsDrillDownOptions = {}): UseStatsDrillDownReturn => {
  const { onNavigateToFiltered, onDataFetch } = options;

  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDrillDown = useCallback(async (stat: StatCardData, data?: any[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let drillDownItems = data;
      
      // If no data provided, try to fetch it
      if (!drillDownItems && onDataFetch) {
        drillDownItems = await onDataFetch(stat);
      }
      
      // Generate title and subtitle
      const title = `${stat.title} Details`;
      const subtitle = typeof stat.value === 'number' 
        ? `Showing ${drillDownItems?.length || 0} of ${stat.value} items`
        : `${stat.title} breakdown`;

      const newDrillDownData: DrillDownData = {
        title,
        subtitle,
        data: drillDownItems || [],
        filters: stat.filterCriteria || {},
        originalStat: stat,
        timestamp: new Date().toISOString(),
      };

      setDrillDownData(newDrillDownData);
      setIsDrillDownOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drill-down data');
      console.error('Drill-down error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onDataFetch]);

  const closeDrillDown = useCallback(() => {
    setIsDrillDownOpen(false);
    setDrillDownData(null);
    setError(null);
  }, []);

  const navigateToFilteredView = useCallback((filters?: Record<string, any>) => {
    const filtersToApply = filters || drillDownData?.filters || {};
    
    if (onNavigateToFiltered) {
      onNavigateToFiltered(filtersToApply);
      closeDrillDown();
    }
  }, [drillDownData, onNavigateToFiltered, closeDrillDown]);

  const refreshDrillDownData = useCallback(async () => {
    if (!drillDownData || !onDataFetch) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const freshData = await onDataFetch(drillDownData.originalStat);
      
      setDrillDownData(prev => prev ? {
        ...prev,
        data: freshData,
        timestamp: new Date().toISOString(),
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      console.error('Refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [drillDownData, onDataFetch]);

  return {
    isDrillDownOpen,
    drillDownData,
    isLoading,
    error,
    
    openDrillDown,
    closeDrillDown,
    navigateToFilteredView,
    refreshDrillDownData,
  };
};