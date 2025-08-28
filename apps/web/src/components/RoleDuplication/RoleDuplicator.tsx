import React, { useState, useCallback, useEffect } from 'react';
import {
  Copy,
  Settings,
  Eye,
  Check,
  X,
  AlertTriangle,
  Info,
  Sparkles,
  ClipboardList,
  RotateCcw
} from 'lucide-react';
import { Role } from '../../services/roleService';
import {
  CloneConfiguration,
  CloneType,
  RoleDuplicatorProps,
  SmartCloneRecommendation
} from '../../types/roleDuplication';
import { useRoleDuplication } from '../../hooks/useRoleDuplication';
import { useRoleLineage } from '../../hooks/useRoleLineage';
import CloneOptionsDialog from './CloneOptionsDialog';
import ClonePreview from './ClonePreview';
import RoleLineageTree from './RoleLineageTree';

const CLONE_TYPE_OPTIONS: Array<{
  value: CloneType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'full',
    label: 'Full Clone',
    description: 'Copy everything exactly as is',
    icon: <Copy className="h-5 w-5" />
  },
  {
    value: 'permissions',
    label: 'Permissions Only',
    description: 'Copy only permissions, reset metadata',
    icon: <ClipboardList className="h-5 w-5" />
  },
  {
    value: 'template',
    label: 'Template Clone',
    description: 'Create template with suggested modifications',
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    value: 'partial',
    label: 'Partial Clone',
    description: 'Select specific permissions to copy',
    icon: <Settings className="h-5 w-5" />
  },
  {
    value: 'hierarchy',
    label: 'Hierarchy Clone',
    description: 'Clone with hierarchy-appropriate adjustments',
    icon: <RotateCcw className="h-5 w-5" />
  }
];

const RoleDuplicator: React.FC<RoleDuplicatorProps> = ({
  sourceRole,
  onCloneComplete,
  onCancel,
  initialConfiguration,
  context,
  showAdvancedOptions = true,
  _enableBatchCloning = false,
  className = ''
}) => {
  const [step, setStep] = useState<'configure' | 'preview' | 'confirm'>('configure');
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showLineageTree, setShowLineageTree] = useState(false);
  const [selectedCloneType, setSelectedCloneType] = useState<CloneType>('full');
  
  const {
    isCloning,
    clonePreview,
    validationResult,
    recommendations,
    startClone,
    updateConfiguration,
    generatePreview,
    _validateConfiguration,
    executeClone,
    cancelClone,
    applyRecommendation,
    _getSmartSuggestions
  } = useRoleDuplication(context);
  
  const {
    lineage,
    ancestors,
    descendants,
    loadLineage
  } = useRoleLineage(sourceRole.id);

  // Initialize clone when component mounts
  useEffect(() => {
    if (sourceRole && !isCloning) {
      startClone(sourceRole.id, initialConfiguration);
      loadLineage(sourceRole.id);
    }
  }, [sourceRole, initialConfiguration, startClone, loadLineage, isCloning]);

  // Handle clone type selection
  const handleCloneTypeChange = useCallback((cloneType: CloneType) => {
    setSelectedCloneType(cloneType);
    updateConfiguration({ cloneType });
  }, [updateConfiguration]);

  // Handle configuration update
  const handleConfigurationUpdate = useCallback((updates: Partial<CloneConfiguration>) => {
    updateConfiguration(updates);
  }, [updateConfiguration]);

  // Handle preview generation
  const handleGeneratePreview = useCallback(async () => {
    try {
      await generatePreview();
      setStep('preview');
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  }, [generatePreview]);

  // Handle clone execution
  const handleExecuteClone = useCallback(async () => {
    try {
      const clonedRole = await executeClone();
      onCloneComplete(clonedRole);
    } catch (error) {
      console.error('Error executing clone:', error);
    }
  }, [executeClone, onCloneComplete]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancelClone();
    onCancel();
  }, [cancelClone, onCancel]);

  // Apply smart recommendation
  const handleApplyRecommendation = useCallback((recommendation: SmartCloneRecommendation) => {
    applyRecommendation(recommendation);
  }, [applyRecommendation]);

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Copy className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Clone Role</h2>
              <p className="text-sm text-gray-600">
                Creating copy of <span className="font-medium">{sourceRole.name}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Lineage Tree Toggle */}
            {(ancestors.length > 0 || descendants.length > 0) && (
              <button
                onClick={() => setShowLineageTree(!showLineageTree)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="View role lineage"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            )}
            
            {/* Advanced Options */}
            {showAdvancedOptions && (
              <button
                onClick={() => setShowOptionsDialog(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Advanced options"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            {['configure', 'preview', 'confirm'].map((stepName, index) => {
              const isActive = step === stepName;
              const isCompleted = ['configure', 'preview', 'confirm'].indexOf(step) > index;
              
              return (
                <div key={stepName} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${isActive ? 'bg-blue-600 text-white' :
                      isCompleted ? 'bg-green-600 text-white' :
                      'bg-gray-200 text-gray-600'}
                  `}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 2 && (
                    <div className={`
                      w-16 h-0.5 ml-2
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Configure</span>
            <span>Preview</span>
            <span>Confirm</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 'configure' && (
          <ConfigureStep
            sourceRole={sourceRole}
            selectedCloneType={selectedCloneType}
            cloneTypeOptions={CLONE_TYPE_OPTIONS}
            recommendations={recommendations}
            validationResult={validationResult}
            onCloneTypeChange={handleCloneTypeChange}
            onConfigurationUpdate={handleConfigurationUpdate}
            onApplyRecommendation={handleApplyRecommendation}
            onNext={handleGeneratePreview}
            onCancel={handleCancel}
          />
        )}

        {step === 'preview' && clonePreview && (
          <ClonePreview
            preview={clonePreview}
            onEdit={() => setStep('configure')}
            onConfirm={() => setStep('confirm')}
            onCancel={handleCancel}
            showDetailedDiff
            showValidationDetails
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            sourceRole={sourceRole}
            clonePreview={clonePreview}
            isCloning={isCloning}
            onExecute={handleExecuteClone}
            onBack={() => setStep('preview')}
            onCancel={handleCancel}
          />
        )}
      </div>

      {/* Role Lineage Tree Modal */}
      {showLineageTree && lineage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Role Lineage Tree</h3>
                <button
                  onClick={() => setShowLineageTree(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              <RoleLineageTree
                rootRole={lineage}
                selectedRoleId={sourceRole.id}
                showCloneActions={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Options Dialog */}
      {showOptionsDialog && (
        <CloneOptionsDialog
          isOpen={showOptionsDialog}
          sourceRole={sourceRole}
          onConfirm={(config) => {
            updateConfiguration(config);
            setShowOptionsDialog(false);
          }}
          onCancel={() => setShowOptionsDialog(false)}
          showPreview
          enableSmartSuggestions
        />
      )}
    </div>
  );
};

// Configure Step Component
interface ConfigureStepProps {
  sourceRole: Role;
  selectedCloneType: CloneType;
  cloneTypeOptions: typeof CLONE_TYPE_OPTIONS;
  recommendations: SmartCloneRecommendation[];
  validationResult: any;
  onCloneTypeChange: (type: CloneType) => void;
  onConfigurationUpdate: (updates: any) => void;
  onApplyRecommendation: (rec: SmartCloneRecommendation) => void;
  onNext: () => void;
  onCancel: () => void;
}

const ConfigureStep: React.FC<ConfigureStepProps> = ({
  sourceRole,
  selectedCloneType,
  cloneTypeOptions,
  recommendations,
  validationResult,
  onCloneTypeChange,
  onConfigurationUpdate,
  onApplyRecommendation,
  onNext,
  onCancel
}) => {
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleLevel, setRoleLevel] = useState(50);

  const handleNameChange = (name: string) => {
    setRoleName(name);
    onConfigurationUpdate({ newMetadata: { name, description: roleDescription, level: roleLevel } });
  };

  const handleDescriptionChange = (description: string) => {
    setRoleDescription(description);
    onConfigurationUpdate({ newMetadata: { name: roleName, description, level: roleLevel } });
  };

  const handleLevelChange = (level: number) => {
    setRoleLevel(level);
    onConfigurationUpdate({ newMetadata: { name: roleName, description: roleDescription, level } });
  };

  return (
    <div className="space-y-6">
      {/* Clone Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Clone Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cloneTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onCloneTypeChange(option.value)}
              className={`
                p-4 border rounded-lg text-left transition-all
                ${selectedCloneType === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  p-2 rounded-lg
                  ${selectedCloneType === option.value
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm opacity-75">{option.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Role Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role Name *
          </label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter role name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level
          </label>
          <input
            type="number"
            value={roleLevel}
            onChange={(e) => handleLevelChange(parseInt(e.target.value) || 50)}
            min="10"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={roleDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Describe this role's purpose and responsibilities"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Smart Suggestions</span>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-md">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{rec.explanation}</div>
                  <div className="text-sm text-gray-600">{rec.reasoning}</div>
                  <div className="flex items-center mt-1">
                    <div className="text-xs text-blue-600">
                      Confidence: {Math.round(rec.confidence * 100)}%
                    </div>
                  </div>
                </div>
                {rec.isAutoApplicable && (
                  <button
                    onClick={() => onApplyRecommendation(rec)}
                    className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {validationResult && (
        <div className="space-y-2">
          {validationResult.errors.filter((e: any) => e.severity === 'error').map((error: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{error.message}</span>
            </div>
          ))}
          {validationResult.errors.filter((e: any) => e.severity === 'warning').map((warning: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-yellow-600 text-sm">
              <Info className="h-4 w-4" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onNext}
          disabled={!roleName.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </div>
        </button>
      </div>
    </div>
  );
};

// Confirm Step Component
interface ConfirmStepProps {
  sourceRole: Role;
  clonePreview: any;
  isCloning: boolean;
  onExecute: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  sourceRole,
  clonePreview,
  isCloning,
  onExecute,
  onBack,
  onCancel
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready to Clone Role
        </h3>
        <p className="text-gray-600">
          You're about to create a new role based on <span className="font-medium">{sourceRole.name}</span>
        </p>
      </div>

      {clonePreview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">New Role Name:</div>
              <div className="text-gray-900">{clonePreview.targetConfiguration.newMetadata.name}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Level:</div>
              <div className="text-gray-900">{clonePreview.targetConfiguration.newMetadata.level}</div>
            </div>
            <div className="col-span-2">
              <div className="font-medium text-gray-700">Permissions:</div>
              <div className="text-gray-900">{clonePreview.resultingPermissions.length} permissions</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          disabled={isCloning}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onBack}
          disabled={isCloning}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onExecute}
          disabled={isCloning}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isCloning ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Cloning...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Copy className="h-4 w-4" />
              <span>Create Role</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default RoleDuplicator;
