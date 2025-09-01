import React, { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useVendors, useVendorStats, useVendorLinks } from '../../hooks/useVendors';
import { Vendor, VendorCategory } from '../../types/vendors';
import PermissionGate from '../../components/PermissionGate';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorDisplay from '../../components/ErrorDisplay';

// Performance Metrics Card Component
interface PerformanceMetricsCardProps {
  vendor: Vendor;
}

const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({ vendor }) => {
  const performance = vendor.performance || {
    averageResponseTime: 0,
    confirmationRate: 0,
    totalBookings: 0,
    rating: undefined,
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return '⭐ Not rated';
    return '⭐'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{vendor.category.replace('_', ' ')}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl">{getRatingStars(performance.rating)}</p>
          {performance.rating && (
            <p className="text-sm text-gray-500">{performance.rating.toFixed(1)}/5.0</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Response Time</p>
          <p className="text-lg font-semibold text-gray-900">
            {Math.round(performance.averageResponseTime)}h
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Confirmation Rate</p>
          <p className={`text-lg font-semibold ${getPerformanceColor(performance.confirmationRate)}`}>
            {Math.round(performance.confirmationRate)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-lg font-semibold text-gray-900">
            {performance.totalBookings}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Status</p>
          <p className={`text-sm font-medium ${vendor.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {vendor.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
      </div>

      {performance.lastBookingDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last booking: {new Date(performance.lastBookingDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

// Response Time Chart Component (Simplified)
interface ResponseTimeChartProps {
  vendors: Vendor[];
}

const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ vendors }) => {
  const activeVendors = vendors.filter(v => v.isActive);
  
  // Calculate average response times by category
  const categoryStats = activeVendors.reduce((acc, vendor) => {
    const category = vendor.category;
    const responseTime = vendor.performance?.averageResponseTime || 0;
    
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0, average: 0 };
    }
    
    acc[category].total += responseTime;
    acc[category].count += 1;
    acc[category].average = acc[category].total / acc[category].count;
    
    return acc;
  }, {} as Record<VendorCategory, { total: number; count: number; average: number }>);

  const maxAverage = Math.max(...Object.values(categoryStats).map(s => s.average));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time by Category</h3>
      
      <div className="space-y-4">
        {Object.entries(categoryStats).map(([category, stats]) => (
          <div key={category} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {category.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(stats.average)}h avg ({stats.count} vendors)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(stats.average / maxAverage) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VendorPerformancePage: React.FC = () => {
  const { getCurrentPropertyName } = useTenant();
  const [selectedCategory, setSelectedCategory] = useState<VendorCategory | ''>('');
  const [sortBy, setSortBy] = useState<'rating' | 'responseTime' | 'confirmationRate'>('rating');
  
  const { data: vendorsData, isLoading: vendorsLoading, error: vendorsError } = useVendors({ isActive: true });
  const { data: statsData, isLoading: statsLoading } = useVendorStats();
  const { data: linksData } = useVendorLinks();

  const vendors = vendorsData?.data?.data || [];
  const stats = statsData?.data;
  const links = linksData?.data?.data || [];
  
  const propertyName = getCurrentPropertyName();

  // Filter vendors by category
  const filteredVendors = selectedCategory 
    ? vendors.filter(v => v.category === selectedCategory)
    : vendors;

  // Sort vendors
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    const aPerformance = a.performance || { averageResponseTime: 0, confirmationRate: 0, rating: 0 };
    const bPerformance = b.performance || { averageResponseTime: 0, confirmationRate: 0, rating: 0 };
    
    switch (sortBy) {
      case 'rating':
        return (bPerformance.rating || 0) - (aPerformance.rating || 0);
      case 'responseTime':
        return aPerformance.averageResponseTime - bPerformance.averageResponseTime;
      case 'confirmationRate':
        return bPerformance.confirmationRate - aPerformance.confirmationRate;
      default:
        return 0;
    }
  });

  // Get unique categories
  const categories = Array.from(new Set(vendors.map(v => v.category)));

  // Calculate overall metrics
  const overallMetrics = {
    totalVendors: vendors.length,
    activeVendors: vendors.filter(v => v.isActive).length,
    averageRating: vendors.length > 0 
      ? vendors.reduce((sum, v) => sum + (v.performance?.rating || 0), 0) / vendors.length
      : 0,
    averageResponseTime: vendors.length > 0
      ? vendors.reduce((sum, v) => sum + (v.performance?.averageResponseTime || 0), 0) / vendors.length
      : 0,
    averageConfirmationRate: vendors.length > 0
      ? vendors.reduce((sum, v) => sum + (v.performance?.confirmationRate || 0), 0) / vendors.length
      : 0,
  };

  if (vendorsLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (vendorsError) {
    return (
      <ErrorDisplay
        message="Failed to load vendor performance data"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <PermissionGate resource="vendors" action="read" scope="property">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="heading-2">Vendor Performance Analytics</h1>
            <p className="text-gray-600">Track vendor performance and response metrics for {propertyName}</p>
          </div>
        </div>

        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-blue-600">Total Vendors</p>
            <p className="text-2xl font-bold text-blue-800">{overallMetrics.totalVendors}</p>
            <p className="text-xs text-blue-600">{overallMetrics.activeVendors} active</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">⭐</div>
            <p className="text-sm text-green-600">Avg Rating</p>
            <p className="text-2xl font-bold text-green-800">
              {overallMetrics.averageRating.toFixed(1)}
            </p>
            <p className="text-xs text-green-600">out of 5.0</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">⏱️</div>
            <p className="text-sm text-yellow-600">Avg Response</p>
            <p className="text-2xl font-bold text-yellow-800">
              {Math.round(overallMetrics.averageResponseTime)}h
            </p>
            <p className="text-xs text-yellow-600">response time</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm text-purple-600">Confirmation</p>
            <p className="text-2xl font-bold text-purple-800">
              {Math.round(overallMetrics.averageConfirmationRate)}%
            </p>
            <p className="text-xs text-purple-600">success rate</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🔗</div>
            <p className="text-sm text-red-600">Active Links</p>
            <p className="text-2xl font-bold text-red-800">
              {links.filter(l => l.status === 'pending').length}
            </p>
            <p className="text-xs text-red-600">pending</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponseTimeChart vendors={vendors} />
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Vendors</h3>
            <div className="space-y-3">
              {sortedVendors.slice(0, 5).map((vendor, index) => (
                <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-800">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{vendor.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {vendor.performance?.rating?.toFixed(1) || 'N/A'} ⭐
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(vendor.performance?.confirmationRate || 0)}% confirmed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as VendorCategory | '')}
                  className="form-input"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="form-input"
                >
                  <option value="rating">Rating</option>
                  <option value="responseTime">Response Time</option>
                  <option value="confirmationRate">Confirmation Rate</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {sortedVendors.length} of {vendors.length} vendors
            </div>
          </div>
        </div>

        {/* Vendor Performance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedVendors.map((vendor) => (
            <PerformanceMetricsCard key={vendor.id} vendor={vendor} />
          ))}
        </div>

        {sortedVendors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
            <p className="text-gray-600">
              {selectedCategory 
                ? `No vendors found in the ${selectedCategory.replace('_', ' ')} category.`
                : 'Add vendors and create links to start tracking performance metrics.'
              }
            </p>
          </div>
        )}
      </div>
    </PermissionGate>
  );
};

export default VendorPerformancePage;