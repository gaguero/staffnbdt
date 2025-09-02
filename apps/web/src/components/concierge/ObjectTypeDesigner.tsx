import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ObjectType, ObjectFieldDefinition, CreateObjectTypeInput } from '../../types/concierge';
import FieldBuilder from './FieldBuilder';
import HierarchyVisualization from './HierarchyVisualization';
import TemplatePreview from './TemplatePreview';
import LoadingSpinner from '../LoadingSpinner';
import toastService from '../../services/toastService';
import conciergeService from '../../services/conciergeService';

interface ObjectTypeDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingObjectType?: ObjectType;
  allObjectTypes?: ObjectType[];
}

interface DesignerTab {
  id: 'basic' | 'fields' | 'hierarchy' | 'preview';
  label: string;
  icon: string;
}

const DESIGNER_TABS: DesignerTab[] = [
  { id: 'basic', label: 'Basic Info', icon: '📝' },
  { id: 'fields', label: 'Fields', icon: '🏗️' },
  { id: 'hierarchy', label: 'Hierarchy', icon: '🌳' },
  { id: 'preview', label: 'Preview', icon: '👁️' },
];

const ObjectTypeDesigner: React.FC<ObjectTypeDesignerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingObjectType,
  allObjectTypes = [],
}) => {
  const [activeTab, setActiveTab] = useState<DesignerTab['id']>('basic');
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const [formData, setFormData] = useState<CreateObjectTypeInput>({
    name: '',
    fieldsSchema: { fields: [] },
    validations: {},
    uiHints: {},
    isActive: true,
  });

  const [parentObjectType, setParentObjectType] = useState<string | null>(null);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);

  // Initialize form data from existing object type
  useEffect(() => {
    if (existingObjectType) {
      setFormData({
        name: existingObjectType.name,
        fieldsSchema: existingObjectType.fieldsSchema,
        validations: existingObjectType.validations || {},
        uiHints: existingObjectType.uiHints || {},
        isActive: existingObjectType.isActive,
      });
      
      // Extract parent from ui hints if available
      if (existingObjectType.uiHints?.parentObjectTypeId) {
        setParentObjectType(existingObjectType.uiHints.parentObjectTypeId);
      }
    }
  }, [existingObjectType]);

  const handleBasicInfoChange = useCallback((field: keyof CreateObjectTypeInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  }, []);

  const handleFieldsChange = useCallback((fields: ObjectFieldDefinition[]) => {
    setFormData(prev => ({
      ...prev,
      fieldsSchema: { fields },
    }));
    setIsDirty(true);
  }, []);

  const handleParentChange = useCallback((parentId: string | null) => {
    setParentObjectType(parentId);
    setFormData(prev => ({
      ...prev,
      uiHints: {
        ...prev.uiHints,
        parentObjectTypeId: parentId,
      },
    }));
    setIsDirty(true);
  }, []);

  // Drag and drop handlers for field reordering
  const handleDragStart = (start: any) => {
    setDraggedFieldIndex(start.source.index);
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    setDraggedFieldIndex(null);
    
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    const newFields = Array.from(formData.fieldsSchema.fields);
    const [reorderedItem] = newFields.splice(source.index, 1);
    newFields.splice(destination.index, 0, reorderedItem);

    handleFieldsChange(newFields);
  }, [formData.fieldsSchema.fields, handleFieldsChange]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toastService.error('Object type name is required');
      return;
    }

    if (formData.fieldsSchema.fields.length === 0) {
      toastService.error('At least one field is required');
      return;
    }

    setLoading(true);
    
    try {
      if (existingObjectType) {
        await conciergeService.updateObjectType(existingObjectType.id, formData);
        toastService.actions.updated('Object Type', formData.name);
      } else {
        await conciergeService.createObjectType(formData);
        toastService.actions.created('Object Type', formData.name);
      }
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to save object type:', error);
      toastService.actions.operationFailed(
        existingObjectType ? 'update' : 'create', 
        error.response?.data?.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    
    // Reset state
    setActiveTab('basic');
    setFormData({
      name: '',
      fieldsSchema: { fields: [] },
      validations: {},
      uiHints: {},
      isActive: true,
    });
    setParentObjectType(null);
    setIsDirty(false);
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSubmit, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-warm-gold to-primary-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-heading">
                {existingObjectType ? 'Edit Object Type' : 'Design Object Type'}
              </h2>
              <p className="text-primary-100 mt-1">
                Create hierarchical object structures with custom fields and relationships
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-primary-200 text-2xl p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
              disabled={loading}
            >
              ✕
            </button>
          </div>
          
          {isDirty && (
            <div className="mt-3 text-sm text-primary-100 flex items-center">
              <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
              Unsaved changes
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8">
            {DESIGNER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-warm-gold text-warm-gold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(95vh - 200px)' }}>
          {activeTab === 'basic' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="form-label">Object Type Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  className="form-input text-lg"
                  placeholder="e.g., Restaurant Reservation, Room Service Request"
                  autoFocus
                />
                <p className="text-sm text-gray-600 mt-1">
                  Choose a clear, descriptive name for this object type
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleBasicInfoChange('isActive', e.target.checked)}
                  className="mr-3"
                />
                <label className="text-sm font-medium">Active object type</label>
                <p className="text-xs text-gray-500 ml-2">
                  Inactive types cannot be used to create new objects
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">💡 Design Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use specific, action-oriented names (e.g., "VIP Arrival Setup" vs "VIP")</li>
                  <li>• Consider the staff perspective - what action are they completing?</li>
                  <li>• Think about hierarchical relationships if this relates to other object types</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'fields' && (
            <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
              <FieldBuilder
                fields={formData.fieldsSchema.fields}
                onChange={handleFieldsChange}
                draggedIndex={draggedFieldIndex}
              />
            </DragDropContext>
          )}

          {activeTab === 'hierarchy' && (
            <HierarchyVisualization
              currentObjectType={{
                ...formData,
                id: existingObjectType?.id || 'new',
                organizationId: '',
                propertyId: '',
              }}
              allObjectTypes={allObjectTypes}
              parentObjectType={parentObjectType}
              onParentChange={handleParentChange}
            />
          )}

          {activeTab === 'preview' && (
            <TemplatePreview
              objectType={{
                ...formData,
                id: existingObjectType?.id || 'preview',
                organizationId: '',
                propertyId: '',
              }}
              parentObjectType={parentObjectType ? 
                allObjectTypes.find(ot => ot.id === parentObjectType) : 
                undefined
              }
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {formData.fieldsSchema.fields.length} field{formData.fieldsSchema.fields.length !== 1 ? 's' : ''} configured
              {parentObjectType && (
                <span className="ml-4">
                  Inherits from: {allObjectTypes.find(ot => ot.id === parentObjectType)?.name || 'Unknown'}
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary min-w-[140px]"
                disabled={loading || !formData.name.trim() || formData.fieldsSchema.fields.length === 0}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  existingObjectType ? 'Update Type' : 'Create Type'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectTypeDesigner;