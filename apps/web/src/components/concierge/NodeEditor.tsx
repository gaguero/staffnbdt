import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { PlaybookNodeData } from '../../types/concierge';
import { Settings, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface NodeEditorProps {
  node: Node;
  onUpdate: (data: Partial<PlaybookNodeData>) => void;
  validationErrors: string[];
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onUpdate, validationErrors }) => {
  const [localConfig, setLocalConfig] = useState<any>(node.data.config || {});
  const [label, setLabel] = useState(node.data.label || '');

  useEffect(() => {
    setLocalConfig(node.data.config || {});
    setLabel(node.data.label || '');
  }, [node.data]);

  const handleConfigChange = (field: string, value: any) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    
    // Update node immediately
    onUpdate({
      config: newConfig,
      isValid: validateConfig(node.type, newConfig),
      errors: getConfigErrors(node.type, newConfig),
    });
  };

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onUpdate({ label: newLabel });
  };

  const validateConfig = (nodeType: string | undefined, config: any): boolean => {
    switch (nodeType) {
      case 'trigger':
        return !!(config.triggerType);
      case 'condition': 
        return !!(config.field && config.operator && config.value !== undefined);
      case 'action':
        return !!(config.actionType);
      case 'enforcement':
        return !!(config.enforcementType);
      default:
        return false;
    }
  };

  const getConfigErrors = (nodeType: string | undefined, config: any): string[] => {
    const errors: string[] = [];
    
    switch (nodeType) {
      case 'trigger':
        if (!config.triggerType) errors.push('Trigger type is required');
        break;
      case 'condition':
        if (!config.field) errors.push('Field is required');
        if (!config.operator) errors.push('Operator is required');
        if (config.value === undefined || config.value === '') errors.push('Value is required');
        break;
      case 'action':
        if (!config.actionType) errors.push('Action type is required');
        break;
      case 'enforcement':
        if (!config.enforcementType) errors.push('Enforcement type is required');
        break;
    }
    
    return errors;
  };

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
        <select
          value={localConfig.triggerType || ''}
          onChange={(e) => handleConfigChange('triggerType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select trigger...</option>
          <option value="reservation.created">Reservation Created</option>
          <option value="concierge.object.completed">Object Completed</option>
          <option value="manual">Manual</option>
          <option value="time.scheduled">Time Scheduled</option>
        </select>
      </div>

      {localConfig.triggerType === 'time.scheduled' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
          <input
            type="time"
            value={localConfig.scheduledTime || ''}
            onChange={(e) => handleConfigChange('scheduledTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {localConfig.triggerType === 'reservation.created' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Types (optional)</label>
          <input
            type="text"
            placeholder="e.g., suite, standard, deluxe"
            value={localConfig.roomTypes || ''}
            onChange={(e) => handleConfigChange('roomTypes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated list. Leave empty for all types.</p>
        </div>
      )}
    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Field</label>
        <select
          value={localConfig.field || ''}
          onChange={(e) => handleConfigChange('field', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select field...</option>
          <option value="guest.vipStatus">Guest VIP Status</option>
          <option value="reservation.roomType">Room Type</option>
          <option value="reservation.stayDuration">Stay Duration</option>
          <option value="reservation.totalGuests">Total Guests</option>
          <option value="time.currentHour">Current Hour</option>
          <option value="guest.preferences">Guest Preferences</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
        <select
          value={localConfig.operator || ''}
          onChange={(e) => handleConfigChange('operator', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select operator...</option>
          <option value="equals">Equals</option>
          <option value="not_equals">Not Equals</option>
          <option value="contains">Contains</option>
          <option value="greater_than">Greater Than</option>
          <option value="less_than">Less Than</option>
          <option value="in">In List</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
        {localConfig.field === 'guest.vipStatus' ? (
          <select
            value={localConfig.value || ''}
            onChange={(e) => handleConfigChange('value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            <option value="true">VIP</option>
            <option value="false">Regular</option>
          </select>
        ) : localConfig.field === 'reservation.roomType' ? (
          <input
            type="text"
            placeholder="e.g., suite, standard, deluxe"
            value={localConfig.value || ''}
            onChange={(e) => handleConfigChange('value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <input
            type={localConfig.operator === 'greater_than' || localConfig.operator === 'less_than' ? 'number' : 'text'}
            placeholder="Enter value..."
            value={localConfig.value || ''}
            onChange={(e) => handleConfigChange('value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    </div>
  );

  const renderActionConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
        <select
          value={localConfig.actionType || ''}
          onChange={(e) => handleConfigChange('actionType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select action...</option>
          <option value="create_object">Create Concierge Object</option>
          <option value="send_notification">Send Notification</option>
          <option value="send_email">Send Email</option>
          <option value="assign_user">Assign to Staff</option>
          <option value="update_status">Update Status</option>
        </select>
      </div>

      {localConfig.actionType === 'create_object' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Object Type</label>
            <input
              type="text"
              placeholder="e.g., restaurant_reservation, transportation"
              value={localConfig.objectType || ''}
              onChange={(e) => handleConfigChange('objectType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title Template</label>
            <input
              type="text"
              placeholder="e.g., Welcome package for {{guest.name}}"
              value={localConfig.titleTemplate || ''}
              onChange={(e) => handleConfigChange('titleTemplate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {localConfig.actionType === 'send_notification' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <select
              value={localConfig.recipients || ''}
              onChange={(e) => handleConfigChange('recipients', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select recipients...</option>
              <option value="concierge_team">Concierge Team</option>
              <option value="front_desk">Front Desk</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="guest">Guest</option>
              <option value="specific_user">Specific User</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              placeholder="Notification message..."
              value={localConfig.message || ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {localConfig.actionType === 'send_email' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
            <select
              value={localConfig.emailTemplate || ''}
              onChange={(e) => handleConfigChange('emailTemplate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select template...</option>
              <option value="welcome">Welcome Email</option>
              <option value="confirmation">Confirmation Email</option>
              <option value="reminder">Reminder Email</option>
              <option value="custom">Custom Email</option>
            </select>
          </div>
          {localConfig.emailTemplate === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                placeholder="Email subject..."
                value={localConfig.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </>
      )}

      {localConfig.actionType === 'assign_user' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Logic</label>
          <select
            value={localConfig.assignmentLogic || ''}
            onChange={(e) => handleConfigChange('assignmentLogic', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select logic...</option>
            <option value="round_robin">Round Robin</option>
            <option value="least_busy">Least Busy</option>
            <option value="department_lead">Department Lead</option>
            <option value="random">Random</option>
            <option value="specific_user">Specific User</option>
          </select>
        </div>
      )}
    </div>
  );

  const renderEnforcementConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Enforcement Type</label>
        <select
          value={localConfig.enforcementType || ''}
          onChange={(e) => handleConfigChange('enforcementType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select enforcement...</option>
          <option value="sla">SLA Timer</option>
          <option value="dependency">Task Dependency</option>
          <option value="approval">Approval Required</option>
        </select>
      </div>

      {localConfig.enforcementType === 'sla' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Due Hours</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            placeholder="e.g., 24"
            value={localConfig.dueHours || ''}
            onChange={(e) => handleConfigChange('dueHours', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Hours after trigger to complete the task</p>
        </div>
      )}

      {localConfig.enforcementType === 'dependency' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Depends On</label>
          <input
            type="text"
            placeholder="Node IDs (comma-separated)"
            value={localConfig.dependsOn?.join(', ') || ''}
            onChange={(e) => handleConfigChange('dependsOn', e.target.value.split(',').map(s => s.trim()))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Tasks that must complete before this one</p>
        </div>
      )}

      {localConfig.enforcementType === 'approval' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Approver Role</label>
          <select
            value={localConfig.approverRole || ''}
            onChange={(e) => handleConfigChange('approverRole', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select role...</option>
            <option value="department_admin">Department Admin</option>
            <option value="property_manager">Property Manager</option>
            <option value="concierge_supervisor">Concierge Supervisor</option>
          </select>
        </div>
      )}
    </div>
  );

  const renderConfigForm = () => {
    switch (node.type) {
      case 'trigger':
        return renderTriggerConfig();
      case 'condition':
        return renderConditionConfig();
      case 'action':
        return renderActionConfig();
      case 'enforcement':
        return renderEnforcementConfig();
      default:
        return <p className="text-gray-500">Unknown node type</p>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2 mb-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Node Editor</h3>
        </div>

        {/* Node Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Node Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Enter node label..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Validation Status */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          {validationErrors.length === 0 ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-700 font-medium">Valid Configuration</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700 font-medium">{validationErrors.length} Error(s)</span>
            </>
          )}
        </div>

        {validationErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-start space-x-1">
                <X className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-red-600">{error}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration</h4>
            {renderConfigForm()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">💡 Tips:</p>
          <ul className="space-y-1 text-gray-500">
            <li>• Use templates like {`{{guest.name}}`} in text fields</li>
            <li>• Connect nodes by dragging from the handles</li>
            <li>• All required fields must be filled</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;