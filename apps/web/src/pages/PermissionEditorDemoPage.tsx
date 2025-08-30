import React, { useState } from 'react';
import { 
  PermissionEditor,
  EditorMode,
  RoleConfiguration,
  RoleLevel
} from '../components/PermissionEditor';

const PermissionEditorDemoPage: React.FC = () => {
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.CREATE);
  const [showEditor, setShowEditor] = useState(false);

  // Sample role for editing/viewing
  const sampleRole: RoleConfiguration = {
    id: 'sample-role-1',
    name: 'Department Supervisor',
    displayName: 'Department Supervisor',
    description: 'A supervisor role with department-level access to manage team members and operations',
    level: RoleLevel.DEPARTMENT,
    isCustomRole: true,
    permissions: [
      'user.read.department',
      'user.create.department', 
      'schedule.manage.department',
      'document.read.department',
      'document.create.department'
    ],
    conditions: [],
    metadata: {
      category: 'management',
      tags: ['supervisor', 'department', 'management'],
      color: 'blue',
      icon: '👔',
      isTemplate: false,
      usage: {
        userCount: 5,
        lastUsed: new Date(),
        popularityScore: 85
      }
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin-user',
    version: 2
  };

  const handleSaveRole = async (role: RoleConfiguration) => {
    console.log('Saving role:', role);
    // In real implementation, this would call your API
    alert(`Role "${role.name}" saved successfully!`);
    setShowEditor(false);
  };

  const handleCancel = () => {
    setShowEditor(false);
  };

  const handlePreview = (role: RoleConfiguration) => {
    console.log('Previewing role:', role);
    // Preview functionality would be handled by the editor
  };

  const startEditor = (mode: EditorMode) => {
    setEditorMode(mode);
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PermissionEditor
          mode={editorMode}
          roleId={editorMode !== EditorMode.CREATE ? sampleRole.id : undefined}
          onSave={handleSaveRole}
          onCancel={handleCancel}
          onPreview={handlePreview}
          maxHeight={window.innerHeight - 100}
          showAdvancedFeatures={true}
          allowTemplateCreation={true}
          enableComparison={true}
          context="role-management"
          className="m-6"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permission Editor Demo</h1>
              <p className="text-gray-600 mt-1">
                Demonstration of the sophisticated Permission Editor component
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">v1.0.0</span>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-blue-600">Hotel Operations Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Feature Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Permission Editor Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">🎨 Visual Interface</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Drag & drop permission management</li>
                <li>• Intuitive categorization</li>
                <li>• Real-time visual feedback</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">🔍 Smart Validation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time conflict detection</li>
                <li>• Dependency analysis</li>
                <li>• Role hierarchy validation</li>
                <li>• Auto-fix suggestions</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">⚡ Advanced Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Role templates</li>
                <li>• Permission search & filtering</li>
                <li>• Undo/redo functionality</li>
                <li>• Export & preview capabilities</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">♿ Accessibility</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Full keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• High contrast compliance</li>
                <li>• Touch-friendly interface</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">🎯 User Experience</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Context-aware recommendations</li>
                <li>• Permission usage analytics</li>
                <li>• Popular permission suggestions</li>
                <li>• Smart categorization</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">🔧 Integration</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• TypeScript support</li>
                <li>• Extensible validation rules</li>
                <li>• Custom permission conditions</li>
                <li>• Multi-tenant ready</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Try the Permission Editor</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Create New Role */}
            <button
              onClick={() => startEditor(EditorMode.CREATE)}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors duration-200">
                <span className="text-2xl">➕</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Create New Role</h3>
              <p className="text-xs text-gray-600">
                Start from scratch or use a template to build a custom role
              </p>
            </button>

            {/* Edit Existing Role */}
            <button
              onClick={() => startEditor(EditorMode.EDIT)}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 text-center"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-200 transition-colors duration-200">
                <span className="text-2xl">✏️</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Edit Role</h3>
              <p className="text-xs text-gray-600">
                Modify an existing role's permissions and settings
              </p>
            </button>

            {/* Clone Role */}
            <button
              onClick={() => startEditor(EditorMode.CLONE)}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 text-center"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors duration-200">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Clone Role</h3>
              <p className="text-xs text-gray-600">
                Create a new role based on an existing one
              </p>
            </button>

            {/* View Role */}
            <button
              onClick={() => startEditor(EditorMode.VIEW)}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors duration-200">
                <span className="text-2xl">👁️</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">View Role</h3>
              <p className="text-xs text-gray-600">
                Inspect a role's permissions and configuration
              </p>
            </button>
          </div>

          {/* Current Role Info (for edit/clone/view modes) */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Sample Role for Demo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <div className="font-medium text-gray-900">{sampleRole.name}</div>
              </div>
              <div>
                <span className="text-gray-500">Level:</span>
                <div className="font-medium text-gray-900">{sampleRole.level}</div>
              </div>
              <div>
                <span className="text-gray-500">Permissions:</span>
                <div className="font-medium text-gray-900">{sampleRole.permissions.length}</div>
              </div>
              <div>
                <span className="text-gray-500">Users:</span>
                <div className="font-medium text-gray-900">{sampleRole.metadata.usage.userCount}</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-gray-500">Description:</span>
              <p className="text-gray-700 mt-1">{sampleRole.description}</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Implementation</h2>
          
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              The Permission Editor is built with modern React patterns and TypeScript for type safety. 
              It features a sophisticated drag-and-drop system, real-time validation, and comprehensive 
              accessibility support.
            </p>
            
            <h3 className="text-gray-900 font-medium mt-6 mb-3">Key Components</h3>
            <ul className="space-y-1">
              <li><strong>PermissionEditor</strong> - Main container component</li>
              <li><strong>PermissionPalette</strong> - Available permissions browser</li>
              <li><strong>PermissionWorkspace</strong> - Selected permissions manager</li>
              <li><strong>ValidationPanel</strong> - Real-time validation feedback</li>
              <li><strong>RoleMetadataEditor</strong> - Role information editor</li>
              <li><strong>PreviewPanel</strong> - Role testing and preview</li>
            </ul>

            <h3 className="text-gray-900 font-medium mt-6 mb-3">Custom Hooks</h3>
            <ul className="space-y-1">
              <li><strong>usePermissionEditor</strong> - Core editor state management</li>
              <li><strong>useDragAndDrop</strong> - Drag & drop functionality</li>
              <li><strong>useRoleValidation</strong> - Validation rules engine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionEditorDemoPage;