import React, { useState } from 'react';
import { Playbook, PlaybookNode } from '../../types/concierge';
import LoadingSpinner from '../LoadingSpinner';
import { Save, X } from 'lucide-react';
import toastService from '../../services/toastService';

interface PlaybookBuilderSimpleProps {
  playbook?: Playbook;
  onSave?: (playbook: Playbook) => void;
  onClose?: () => void;
}

const PlaybookBuilderSimple: React.FC<PlaybookBuilderSimpleProps> = ({
  playbook,
  onSave,
  onClose,
}) => {
  const [playbookName, setPlaybookName] = useState(playbook?.name || 'New Playbook');
  const [isSaving, setIsSaving] = useState(false);
  const [nodes, setNodes] = useState<PlaybookNode[]>(playbook?.flowData?.nodes || []);

  const savePlaybook = async () => {
    setIsSaving(true);
    try {
      // Mock save functionality for now
      const savedPlaybook: Playbook = {
        id: playbook?.id || `playbook-${Date.now()}`,
        organizationId: 'org-1',
        propertyId: 'prop-1',
        name: playbookName,
        trigger: 'manual',
        conditions: [],
        actions: [],
        enforcements: [],
        isActive: true,
        flowData: {
          nodes,
          edges: [],
        }
      };

      toastService.success(`Playbook ${playbook ? 'updated' : 'created'} successfully`);
      onSave?.(savedPlaybook);
    } catch (error: any) {
      console.error('Failed to save playbook:', error);
      toastService.error(`Failed to ${playbook ? 'update' : 'create'} playbook`);
    } finally {
      setIsSaving(false);
    }
  };

  const addNode = (type: 'trigger' | 'condition' | 'action' | 'enforcement') => {
    const newNode: PlaybookNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 100 + nodes.length * 200, y: 100 },
      data: {
        label: `New ${type}`,
        nodeType: type,
        config: {},
        isValid: false,
        errors: ['Node configuration required']
      }
    };
    setNodes(prev => [...prev, newNode]);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={playbookName}
            onChange={(e) => setPlaybookName(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none outline-none"
            placeholder="Playbook Name"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={savePlaybook}
            disabled={isSaving}
            className="btn btn-primary flex items-center space-x-2"
          >
            {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Simple Canvas */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 h-full relative">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Visual Playbook Builder (Phase 2)</h3>
            
            {/* Node Palette */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Add Nodes:</h4>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => addNode('trigger')}
                  className="px-3 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors"
                >
                  + Trigger
                </button>
                <button 
                  onClick={() => addNode('condition')}
                  className="px-3 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  + Condition
                </button>
                <button 
                  onClick={() => addNode('action')}
                  className="px-3 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
                >
                  + Action
                </button>
                <button 
                  onClick={() => addNode('enforcement')}
                  className="px-3 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  + Enforcement
                </button>
              </div>
            </div>

            {/* Simple Node Display */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Current Nodes ({nodes.length}):</h4>
              {nodes.length === 0 ? (
                <p className="text-gray-500 italic">No nodes added yet. Click the buttons above to add workflow nodes.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nodes.map((node) => (
                    <div 
                      key={node.id}
                      className={`p-4 rounded-lg border-2 ${
                        node.type === 'trigger' ? 'bg-red-50 border-red-200' :
                        node.type === 'condition' ? 'bg-orange-50 border-orange-200' :
                        node.type === 'action' ? 'bg-green-50 border-green-200' :
                        'bg-purple-50 border-purple-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{node.data.label}</h5>
                        <button 
                          onClick={() => setNodes(prev => prev.filter(n => n.id !== node.id))}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{node.type} Node</p>
                      <p className="text-xs text-gray-500 mt-1">ID: {node.id.slice(-8)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Future Enhancement Notice */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🚀 Coming Soon in Phase 2</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Drag-and-drop visual workflow builder</li>
                <li>• Node connections and flow visualization</li>
                <li>• Real-time validation and testing</li>
                <li>• Advanced node configuration</li>
                <li>• Mobile-responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybookBuilderSimple;