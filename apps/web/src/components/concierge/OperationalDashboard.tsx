import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conciergeService } from '../../services/conciergeService';
import { conciergeQueryKeys, ConciergeObject } from '../../types/concierge';
import LoadingSpinner from '../LoadingSpinner';
import TodayBoard from './TodayBoard';
import QuickActions from './QuickActions';
import Reservation360 from './Reservation360';
import GuestTimeline from './GuestTimeline';
import PermissionGate from '../PermissionGate';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'blue',
  onClick 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  return (
    <div 
      className={`p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-lg ${colorClasses[color]} ${
        onClick ? 'hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80 uppercase tracking-wide">{title}</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↗️' : '↘️'} {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl opacity-80 ml-4 hover:animate-bounce">
          {icon}
        </div>
      </div>
    </div>
  );
};

interface ActiveTasksProps {
  onTaskClick?: (task: ConciergeObject) => void;
}

const ActiveTasks: React.FC<ActiveTasksProps> = ({ onTaskClick }) => {
  const { data, isLoading } = useQuery({
    queryKey: conciergeQueryKeys.objects.list({ 
      status: ['open', 'in_progress', 'overdue'], 
    }),
    queryFn: () => conciergeService.getObjects({ 
      status: ['open', 'in_progress', 'overdue'] 
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const tasks = data?.data?.data || [];
  const recentTasks = tasks.slice(0, 5); // Show only 5 recent tasks

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Active Tasks</h3>
        <div className="flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          🔄 Recent Active Tasks
        </h3>
        <span className="text-sm text-gray-500">
          {tasks.length} total active
        </span>
      </div>

      {recentTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">✨</div>
          <p className="font-medium">All caught up!</p>
          <p className="text-sm">No active tasks at the moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTasks.map((task) => {
            const title = task.attributes.find(attr => attr.fieldKey === 'title')?.stringValue || task.type;
            const priority = task.attributes.find(attr => attr.fieldKey === 'priority')?.stringValue || 'medium';
            
            const statusColors = {
              open: 'bg-blue-100 text-blue-800',
              in_progress: 'bg-yellow-100 text-yellow-800',
              overdue: 'bg-red-100 text-red-800',
            };

            const priorityIcons = {
              high: '🔴',
              medium: '🟡',
              low: '🟢',
            };

            return (
              <div
                key={task.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all duration-200"
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm">{priorityIcons[priority as keyof typeof priorityIcons] || '⚪'}</span>
                      <h4 className="font-medium text-gray-900 truncate">{title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.type.replace('_', ' ')}</p>
                    {task.dueAt && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(task.dueAt).toLocaleDateString()} at{' '}
                        {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
          
          {tasks.length > 5 && (
            <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all {tasks.length} active tasks →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface OperationalDashboardProps {
  defaultView?: 'dashboard' | 'today' | 'reservations' | 'guests';
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ 
  defaultView = 'dashboard' 
}) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'today' | 'reservations' | 'guests' | 'task-detail'>(defaultView);
  const [selectedTask, setSelectedTask] = useState<ConciergeObject | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: conciergeQueryKeys.stats(),
    queryFn: () => conciergeService.getStats(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch today's board data for stats
  const { data: todayData } = useQuery({
    queryKey: conciergeQueryKeys.todayBoard(),
    queryFn: () => conciergeService.getTodayBoard(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = useMemo(() => {
    const baseStats = statsData?.data || {
      totalObjects: 0,
      openObjects: 0,
      overdueObjects: 0,
      completedToday: 0,
      averageCompletionTime: 0,
    };

    const todayStats = todayData?.data || [];
    const overdueCount = todayStats.find(section => section.title === 'Overdue')?.count || 0;
    const dueTodayCount = todayStats.find(section => section.title === 'Due Today')?.count || 0;

    return {
      ...baseStats,
      overdueObjects: overdueCount,
      dueTodayObjects: dueTodayCount,
    };
  }, [statsData, todayData]);

  const handleTaskCreated = () => {
    // Refresh relevant queries when a new task is created
    // This will be handled by the QuickActions component
  };

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'today', label: "Today's Board", icon: '📋' },
            { id: 'reservations', label: 'Reservations', icon: '🏨' },
            { id: 'guests', label: 'Guest Timeline', icon: '👤' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-2 ${
                currentView === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString([], { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tasks"
          value={stats.totalObjects}
          icon="📝"
          color="blue"
          subtitle="All time"
        />
        <StatsCard
          title="Active Tasks"
          value={stats.openObjects}
          icon="🔄"
          color="yellow"
          subtitle="In progress"
          onClick={() => setCurrentView('today')}
        />
        <StatsCard
          title="Completed Today"
          value={stats.completedToday}
          icon="✅"
          color="green"
          subtitle="Great progress!"
          trend={{
            value: "+12%",
            isPositive: true
          }}
        />
        <StatsCard
          title="Overdue Items"
          value={stats.overdueObjects}
          icon="⚠️"
          color={stats.overdueObjects > 0 ? "red" : "green"}
          subtitle={stats.overdueObjects === 0 ? "Perfect!" : "Needs attention"}
          onClick={() => stats.overdueObjects > 0 && setCurrentView('today')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="xl:col-span-1">
          <QuickActions onTaskCreated={handleTaskCreated} />
        </div>

        {/* Active Tasks */}
        <div className="xl:col-span-2">
          <ActiveTasks onTaskClick={(task) => {
            setSelectedTask(task);
            setCurrentView('task-detail');
          }} />
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📈 Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.averageCompletionTime || 0}h
            </div>
            <p className="text-sm text-gray-600">Avg. Completion Time</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.round((stats.completedToday / Math.max(stats.totalObjects, 1)) * 100)}%
            </div>
            <p className="text-sm text-gray-600">Tasks Completed Rate</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.dueTodayObjects || 0}
            </div>
            <p className="text-sm text-gray-600">Due Today</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'today':
        return (
          <TodayBoard 
            onObjectClick={(task) => {
              setSelectedTask(task);
              setCurrentView('task-detail');
            }}
          />
        );

      case 'reservations':
        return selectedReservation ? (
          <div>
            <div className="mb-4">
              <button
                onClick={() => {
                  setSelectedReservation(null);
                  setCurrentView('reservations');
                }}
                className="btn btn-outline btn-sm"
              >
                ← Back to Reservations
              </button>
            </div>
            <Reservation360 reservation={selectedReservation} />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reservation Management</h3>
            <p className="text-gray-600 mb-6">Select a reservation to view detailed checklist and guest requirements</p>
            <button 
              onClick={() => {
                // Mock reservation data - replace with actual reservation selection
                setSelectedReservation({
                  id: 'res-123',
                  confirmationNumber: 'CNF-2024-001',
                  status: 'CONFIRMED',
                  checkInDate: '2024-03-20',
                  checkOutDate: '2024-03-25',
                  guest: {
                    firstName: 'Maria',
                    lastName: 'Rodriguez'
                  },
                  room: { number: '302' },
                  roomType: { name: 'Ocean View Suite' },
                  adults: 2,
                  children: 0
                });
              }}
              className="btn btn-primary"
            >
              View Sample Reservation
            </button>
          </div>
        );

      case 'guests':
        return selectedGuest ? (
          <div>
            <div className="mb-4">
              <button
                onClick={() => {
                  setSelectedGuest(null);
                  setCurrentView('guests');
                }}
                className="btn btn-outline btn-sm"
              >
                ← Back to Guests
              </button>
            </div>
            <GuestTimeline guest={selectedGuest} />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Guest Timeline</h3>
            <p className="text-gray-600 mb-6">Select a guest to view their interaction history and timeline</p>
            <button 
              onClick={() => {
                // Mock guest data - replace with actual guest selection
                setSelectedGuest({
                  id: 'guest-123',
                  firstName: 'Maria',
                  lastName: 'Rodriguez',
                  email: 'maria.rodriguez@email.com',
                  phone: '+1 555-0123',
                  vipStatus: true,
                  blacklisted: false,
                  totalStays: 5,
                  totalSpent: 12500
                });
              }}
              className="btn btn-primary"
            >
              View Sample Guest
            </button>
          </div>
        );

      case 'task-detail':
        return selectedTask ? (
          <div>
            <div className="mb-4">
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setCurrentView('dashboard');
                }}
                className="btn btn-outline btn-sm"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Task Type</h3>
                  <p className="text-gray-600">{selectedTask.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <p className="text-gray-600">{selectedTask.status.replace('_', ' ')}</p>
                </div>
                {selectedTask.dueAt && (
                  <div>
                    <h3 className="font-medium text-gray-900">Due Date</h3>
                    <p className="text-gray-600">{new Date(selectedTask.dueAt).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">Attributes</h3>
                  <div className="space-y-2">
                    {selectedTask.attributes.map((attr, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{attr.fieldKey}:</span>
                        <span className="text-gray-900">
                          {attr.stringValue || attr.numberValue || attr.booleanValue?.toString() || 
                           attr.dateValue || JSON.stringify(attr.jsonValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null;

      default:
        return renderDashboard();
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading operational dashboard..." />
      </div>
    );
  }

  return (
    <PermissionGate resource="concierge" action="read" scope="property">
      <div className="min-h-screen bg-gray-50">
        {renderNavigation()}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </PermissionGate>
  );
};

export default OperationalDashboard;