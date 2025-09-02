import React, { useState } from 'react';
import { 
  Zap, 
  Filter, 
  Play, 
  Shield, 
  Search,
  Calendar,
  Clock,
  User,
  Bell,
  Mail,
  MessageCircle,
  FileText,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface NodeTypeConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  category: string;
}

const nodeTypes: NodeTypeConfig[] = [
  // Triggers
  {
    id: 'trigger_reservation_created',
    name: 'Reservation Created',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Triggered when a new reservation is created',
    color: 'red',
    category: 'triggers'
  },
  {
    id: 'trigger_checkin',
    name: 'Guest Check-in',
    icon: <User className="w-5 h-5" />,
    description: 'Triggered when guest checks in',
    color: 'red',
    category: 'triggers'
  },
  {
    id: 'trigger_manual',
    name: 'Manual Trigger',
    icon: <Play className="w-5 h-5" />,
    description: 'Manually triggered playbook',
    color: 'red',
    category: 'triggers'
  },
  {
    id: 'trigger_time_based',
    name: 'Time-based',
    icon: <Clock className="w-5 h-5" />,
    description: 'Triggered at specific times or intervals',
    color: 'red',
    category: 'triggers'
  },

  // Conditions
  {
    id: 'condition_guest_vip',
    name: 'VIP Guest',
    icon: <Shield className="w-5 h-5" />,
    description: 'Check if guest has VIP status',
    color: 'orange',
    category: 'conditions'
  },
  {
    id: 'condition_room_type',
    name: 'Room Type',
    icon: <Filter className="w-5 h-5" />,
    description: 'Filter by room type or category',
    color: 'orange',
    category: 'conditions'
  },
  {
    id: 'condition_stay_duration',
    name: 'Stay Duration',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Check length of stay',
    color: 'orange',
    category: 'conditions'
  },
  {
    id: 'condition_time_range',
    name: 'Time Range',
    icon: <Clock className="w-5 h-5" />,
    description: 'Check if current time is within range',
    color: 'orange',
    category: 'conditions'
  },

  // Actions
  {
    id: 'action_create_object',
    name: 'Create Concierge Object',
    icon: <FileText className="w-5 h-5" />,
    description: 'Create a new concierge task or request',
    color: 'green',
    category: 'actions'
  },
  {
    id: 'action_send_notification',
    name: 'Send Notification',
    icon: <Bell className="w-5 h-5" />,
    description: 'Send notification to staff or guest',
    color: 'green',
    category: 'actions'
  },
  {
    id: 'action_send_email',
    name: 'Send Email',
    icon: <Mail className="w-5 h-5" />,
    description: 'Send automated email',
    color: 'green',
    category: 'actions'
  },
  {
    id: 'action_send_sms',
    name: 'Send SMS',
    icon: <MessageCircle className="w-5 h-5" />,
    description: 'Send SMS message',
    color: 'green',
    category: 'actions'
  },
  {
    id: 'action_assign_user',
    name: 'Assign to Staff',
    icon: <User className="w-5 h-5" />,
    description: 'Assign task to specific staff member',
    color: 'green',
    category: 'actions'
  },
  {
    id: 'action_update_database',
    name: 'Update Database',
    icon: <Database className="w-5 h-5" />,
    description: 'Update guest or reservation data',
    color: 'green',
    category: 'actions'
  },

  // Enforcements
  {
    id: 'enforcement_sla',
    name: 'SLA Timer',
    icon: <Clock className="w-5 h-5" />,
    description: 'Set service level agreement timer',
    color: 'purple',
    category: 'enforcements'
  },
  {
    id: 'enforcement_dependency',
    name: 'Task Dependency',
    icon: <Shield className="w-5 h-5" />,
    description: 'Require completion of other tasks first',
    color: 'purple',
    category: 'enforcements'
  }
];

const categories = {
  triggers: {
    name: 'Triggers',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-red-600',
    description: 'Events that start the playbook'
  },
  conditions: {
    name: 'Conditions', 
    icon: <Filter className="w-4 h-4" />,
    color: 'text-orange-600',
    description: 'Logic to filter when actions occur'
  },
  actions: {
    name: 'Actions',
    icon: <Play className="w-4 h-4" />,
    color: 'text-green-600', 
    description: 'Tasks to be performed'
  },
  enforcements: {
    name: 'Enforcements',
    icon: <Shield className="w-4 h-4" />,
    color: 'text-purple-600',
    description: 'SLAs and dependencies'
  }
};

const NodeLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    triggers: true,
    conditions: false,
    actions: false,
    enforcements: false
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredNodeTypes = nodeTypes.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    const nodeTypeBase = nodeType.split('_')[0]; // Extract base type (trigger, condition, action, enforcement)
    event.dataTransfer.setData('application/reactflow', nodeTypeBase);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getNodeColor = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200', 
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[color as keyof typeof colors] || colors.red;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Node Library</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Categories and Nodes */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(categories).map(([categoryId, category]) => {
          const categoryNodes = filteredNodeTypes.filter(node => node.category === categoryId);
          
          if (categoryNodes.length === 0) return null;

          return (
            <div key={categoryId} className="border-b border-gray-200">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryId)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <span className={`font-medium ${category.color}`}>
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500">({categoryNodes.length})</span>
                </div>
                {expandedCategories[categoryId] ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Category Description */}
              {expandedCategories[categoryId] && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
              )}

              {/* Category Nodes */}
              {expandedCategories[categoryId] && (
                <div className="pb-2">
                  {categoryNodes.map((node) => (
                    <div
                      key={node.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node.id)}
                      className={`mx-2 mb-2 p-3 rounded-lg border cursor-move transition-all hover:shadow-sm ${getNodeColor(node.color)}`}
                      title={node.description}
                    >
                      <div className="flex items-start space-x-2">
                        {node.icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{node.name}</p>
                          <p className="text-xs opacity-75 line-clamp-2 mt-1">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-2">💡 How to use:</p>
          <ul className="space-y-1 text-gray-500">
            <li>• Drag nodes from here onto the canvas</li>
            <li>• Connect nodes by dragging from handles</li>
            <li>• Click nodes to configure them</li>
            <li>• Start with a trigger node</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NodeLibrary;