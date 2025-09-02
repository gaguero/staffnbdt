import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { conciergeService } from '../../services/conciergeService';
import { Playbook } from '../../types/concierge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PermissionGate } from '../../components';
import toastService from '../../services/toastService';
import PlaybookBuilder from '../../components/concierge/PlaybookBuilder';
import { Plus, Edit, Eye, Trash2, Play, Clock, Users, Settings, Calendar, CheckCircle } from 'lucide-react';

const PlaybooksPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load playbooks
  const loadPlaybooks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conciergeService.getPlaybooks();
      setPlaybooks(response.data || []);
    } catch (error) {
      console.error('Failed to load playbooks:', error);
      toastService.error('Failed to load playbooks');
      setPlaybooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaybooks();
  }, [loadPlaybooks]);

  const handleDelete = async (playbookId: string) => {
    if (!window.confirm('Are you sure you want to delete this playbook?')) {
      return;
    }

    try {
      setLoading(true);
      await conciergeService.deletePlaybook(playbookId);
      await loadPlaybooks();
      toastService.success('Playbook deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete playbook:', error);
      toastService.error('Failed to delete playbook');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (playbook: Playbook) => {
    try {
      await conciergeService.executePlaybook({
        playbookId: playbook.id,
        triggerData: { manual: true }
      });
      toastService.success('Playbook executed successfully');
    } catch (error: any) {
      console.error('Failed to execute playbook:', error);
      toastService.error('Failed to execute playbook');
    }
  };

  const openBuilder = (playbook?: Playbook) => {
    setSelectedPlaybook(playbook || null);
    setShowBuilder(true);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setSelectedPlaybook(null);
  };

  const handleSavePlaybook = (playbook: Playbook) => {
    loadPlaybooks();
    closeBuilder();
    toastService.success(`Playbook ${selectedPlaybook ? 'updated' : 'created'} successfully`);
  };

  const getTriggerIcon = (trigger: string) => {
    const icons = {
      'reservation.created': <Calendar className="w-4 h-4" />,
      'concierge.object.completed': <CheckCircle className="w-4 h-4" />,
      'manual': <Play className="w-4 h-4" />,
      'time.scheduled': <Clock className="w-4 h-4" />,
    };
    return icons[trigger as keyof typeof icons] || <Play className="w-4 h-4" />;
  };

  const getTriggerLabel = (trigger: string) => {
    const labels = {
      'reservation.created': 'Reservation Created',
      'concierge.object.completed': 'Object Completed',
      'manual': 'Manual',
      'time.scheduled': 'Scheduled',
    };
    return labels[trigger as keyof typeof labels] || trigger;
  };

  const filteredPlaybooks = playbooks.filter(playbook =>
    playbook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTriggerLabel(playbook.trigger).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showBuilder) {
    return (
      <PlaybookBuilder
        playbook={selectedPlaybook || undefined}
        onSave={handleSavePlaybook}
        onClose={closeBuilder}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Playbooks</h1>
          <p className="text-gray-600">
            Automation workflows for concierge operations
            {currentUser?.role === 'STAFF' && (
              <span className="ml-2 text-sm text-orange-600">(Staff scope)</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <PermissionGate
            resource="concierge"
            action="create"
            scope="property"
            hideOnDenied
          >
            <button
              onClick={() => openBuilder()}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playbook</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search playbooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">📋</div>
          <p className="text-sm text-gray-600">Total Playbooks</p>
          <p className="text-2xl font-bold">{playbooks.length}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {playbooks.filter(p => p.isActive).length}
          </p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🔄</div>
          <p className="text-sm text-gray-600">Auto Triggers</p>
          <p className="text-2xl font-bold text-blue-600">
            {playbooks.filter(p => p.trigger !== 'manual').length}
          </p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">⚡</div>
          <p className="text-sm text-gray-600">Manual</p>
          <p className="text-2xl font-bold text-orange-600">
            {playbooks.filter(p => p.trigger === 'manual').length}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && playbooks.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Playbooks Grid */}
      {!loading && filteredPlaybooks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Playbooks Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'No playbooks match your search.' : 'Create your first automation playbook.'}
          </p>
          <PermissionGate
            resource="concierge"
            action="create"
            scope="property"
            hideOnDenied
          >
            <button
              onClick={() => openBuilder()}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playbook</span>
            </button>
          </PermissionGate>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlaybooks.map((playbook) => (
          <div key={playbook.id} className="card">
            {/* Card Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{playbook.name}</h3>
                  <div className="flex items-center space-x-2">
                    {getTriggerIcon(playbook.trigger)}
                    <span className="text-sm text-gray-600">
                      {getTriggerLabel(playbook.trigger)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      playbook.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {playbook.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-600">Conditions</p>
                  <p className="font-semibold">{playbook.conditions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Actions</p>
                  <p className="font-semibold">{playbook.actions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">SLAs</p>
                  <p className="font-semibold">{playbook.enforcements?.length || 0}</p>
                </div>
              </div>

              {/* Flow Visualization Preview */}
              {playbook.flowData && playbook.flowData.nodes.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Flow: {playbook.flowData.nodes.length} nodes</p>
                  <div className="flex flex-wrap gap-1">
                    {playbook.flowData.nodes.slice(0, 6).map((node, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded text-xs ${
                          node.type === 'trigger' ? 'bg-red-100 text-red-700' :
                          node.type === 'condition' ? 'bg-orange-100 text-orange-700' :
                          node.type === 'action' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {node.type}
                      </span>
                    ))}
                    {playbook.flowData.nodes.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{playbook.flowData.nodes.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card Actions */}
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
              <div className="flex space-x-2">
                <PermissionGate
                  resource="concierge"
                  action="update"
                  scope="property"
                  hideOnDenied
                >
                  <button
                    onClick={() => openBuilder(playbook)}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    title="Edit Playbook"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                </PermissionGate>

                {playbook.trigger === 'manual' && (
                  <PermissionGate
                    resource="concierge"
                    action="execute"
                    scope="property"
                    hideOnDenied
                  >
                    <button
                      onClick={() => handleExecute(playbook)}
                      className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                      title="Execute Playbook"
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm">Run</span>
                    </button>
                  </PermissionGate>
                )}
              </div>

              <PermissionGate
                resource="concierge"
                action="delete"
                scope="property"
                hideOnDenied
              >
                <button
                  onClick={() => handleDelete(playbook.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete Playbook"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </PermissionGate>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaybooksPage;