import React, { useState, useMemo } from 'react';
import { ObjectType } from '../../types/concierge';
import ParentSelector from './ParentSelector';

interface HierarchyVisualizationProps {
  currentObjectType: ObjectType;
  allObjectTypes: ObjectType[];
  parentObjectType: string | null;
  onParentChange: (parentId: string | null) => void;
}

interface HierarchyNode {
  id: string;
  name: string;
  isActive: boolean;
  children: HierarchyNode[];
  level: number;
  isCurrent?: boolean;
  isParent?: boolean;
}

const HierarchyVisualization: React.FC<HierarchyVisualizationProps> = ({
  currentObjectType,
  allObjectTypes,
  parentObjectType,
  onParentChange,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedView, setSelectedView] = useState<'tree' | 'list'>('tree');

  // Build hierarchy tree
  const hierarchyTree = useMemo(() => {
    const nodeMap = new Map<string, HierarchyNode>();
    const roots: HierarchyNode[] = [];
    
    // Create all nodes
    [...allObjectTypes, currentObjectType].forEach(objectType => {
      const parentId = objectType.uiHints?.parentObjectTypeId;
      nodeMap.set(objectType.id, {
        id: objectType.id,
        name: objectType.name,
        isActive: objectType.isActive,
        children: [],
        level: 0,
        isCurrent: objectType.id === currentObjectType.id,
        isParent: objectType.id === parentObjectType,
      });
    });

    // Build parent-child relationships
    nodeMap.forEach(node => {
      const objectType = [...allObjectTypes, currentObjectType].find(ot => ot.id === node.id);
      const parentId = objectType?.uiHints?.parentObjectTypeId;
      
      if (parentId && nodeMap.has(parentId)) {
        const parentNode = nodeMap.get(parentId)!;
        parentNode.children.push(node);
        node.level = parentNode.level + 1;
      } else {
        roots.push(node);
      }
    });

    // Sort children by name
    const sortChildren = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        sortChildren(node.children);
      });
    };
    
    roots.sort((a, b) => a.name.localeCompare(b.name));
    sortChildren(roots);

    return roots;
  }, [allObjectTypes, currentObjectType, parentObjectType]);

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allNodeIds = new Set<string>();
    const collectNodes = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        if (node.children.length > 0) {
          allNodeIds.add(node.id);
          collectNodes(node.children);
        }
      });
    };
    collectNodes(hierarchyTree);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const renderTreeNode = (node: HierarchyNode, isLast = false, prefix = '') => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const nodePrefix = prefix + (isLast ? '└── ' : '├── ');
    const childPrefix = prefix + (isLast ? '    ' : '│   ');

    return (
      <div key={node.id}>
        {/* Node */}
        <div className="flex items-center py-1 text-sm font-mono">
          <span className="text-gray-400 mr-2">{nodePrefix}</span>
          
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="text-gray-500 hover:text-gray-700 mr-2 text-xs"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          <div
            className={`flex items-center px-2 py-1 rounded-md ${
              node.isCurrent
                ? 'bg-warm-gold text-white font-semibold'
                : node.isParent
                ? 'bg-blue-100 text-blue-800 font-medium'
                : node.isActive
                ? 'bg-green-50 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <span className="mr-2">
              {node.isCurrent ? '🎯' : node.isParent ? '👆' : node.isActive ? '✅' : '⏸️'}
            </span>
            {node.name}
            {node.isCurrent && <span className="ml-2 text-xs">(Current)</span>}
            {node.isParent && <span className="ml-2 text-xs">(Selected Parent)</span>}
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child, index) =>
              renderTreeNode(child, index === node.children.length - 1, childPrefix)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    const flattenedNodes: (HierarchyNode & { path: string[] })[] = [];
    
    const flatten = (nodes: HierarchyNode[], path: string[] = []) => {
      nodes.forEach(node => {
        flattenedNodes.push({ ...node, path });
        if (node.children.length > 0) {
          flatten(node.children, [...path, node.name]);
        }
      });
    };
    
    flatten(hierarchyTree);
    
    return (
      <div className="space-y-2">
        {flattenedNodes.map(node => (
          <div
            key={node.id}
            className={`p-3 rounded-lg border-2 ${
              node.isCurrent
                ? 'border-warm-gold bg-warm-gold bg-opacity-10'
                : node.isParent
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <span className="mr-2 text-lg">
                    {node.isCurrent ? '🎯' : node.isParent ? '👆' : node.isActive ? '✅' : '⏸️'}
                  </span>
                  <h4 className="font-semibold text-charcoal">{node.name}</h4>
                  {node.isCurrent && (
                    <span className="ml-2 bg-warm-gold text-white text-xs px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                  {node.isParent && (
                    <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Selected Parent
                    </span>
                  )}
                </div>
                
                {node.path.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Path: {node.path.join(' → ')} → <span className="font-medium">{node.name}</span>
                  </p>
                )}
                
                <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                  <span>Level: {node.level + 1}</span>
                  <span>Children: {node.children.length}</span>
                  <span>Status: {node.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getHierarchyStats = () => {
    let totalNodes = 0;
    let maxDepth = 0;
    let activeNodes = 0;

    const traverse = (nodes: HierarchyNode[], depth = 0) => {
      nodes.forEach(node => {
        totalNodes++;
        if (node.isActive) activeNodes++;
        maxDepth = Math.max(maxDepth, depth);
        if (node.children.length > 0) {
          traverse(node.children, depth + 1);
        }
      });
    };

    traverse(hierarchyTree);

    return { totalNodes, maxDepth: maxDepth + 1, activeNodes };
  };

  const stats = getHierarchyStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-charcoal mb-2">Hierarchical Relationships</h3>
        <p className="text-gray-600 text-sm">
          Define parent-child relationships between object types to create structured workflows.
        </p>
      </div>

      {/* Parent Selector */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">Select Parent Object Type</h4>
        <ParentSelector
          allObjectTypes={allObjectTypes}
          currentObjectTypeId={currentObjectType.id}
          selectedParentId={parentObjectType}
          onParentChange={onParentChange}
        />
      </div>

      {/* Hierarchy Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-charcoal">{stats.totalNodes}</div>
          <div className="text-sm text-gray-600">Total Object Types</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-charcoal">{stats.maxDepth}</div>
          <div className="text-sm text-gray-600">Maximum Depth</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.activeNodes}</div>
          <div className="text-sm text-gray-600">Active Types</div>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedView('tree')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              selectedView === 'tree'
                ? 'bg-warm-gold text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🌳 Tree View
          </button>
          <button
            onClick={() => setSelectedView('list')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              selectedView === 'list'
                ? 'bg-warm-gold text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 List View
          </button>
        </div>
        
        {selectedView === 'tree' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Hierarchy Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {hierarchyTree.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Object Types Yet</h3>
            <p className="text-gray-600">
              Create some object types to see the hierarchy visualization.
            </p>
          </div>
        ) : selectedView === 'tree' ? (
          <div className="space-y-1">
            {hierarchyTree.map((node, index) =>
              renderTreeNode(node, index === hierarchyTree.length - 1)
            )}
          </div>
        ) : (
          renderListView()
        )}
      </div>

      {/* Hierarchy Guidelines */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">🎯 Hierarchy Design Tips</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• <strong>Keep it shallow:</strong> Deep hierarchies (5+ levels) can be confusing</li>
          <li>• <strong>Logical grouping:</strong> Parent types should logically contain child types</li>
          <li>• <strong>Workflow flow:</strong> Consider the order staff will complete these tasks</li>
          <li>• <strong>Reusability:</strong> Generic parent types can be reused across different scenarios</li>
          <li>• <strong>Dependencies:</strong> Child objects can inherit or reference parent object data</li>
        </ul>
      </div>

      {/* Current Relationship */}
      {parentObjectType && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">✅ Selected Relationship</h4>
          <div className="text-sm text-green-800">
            <strong>{allObjectTypes.find(ot => ot.id === parentObjectType)?.name}</strong>
            <span className="mx-2">→</span>
            <strong>{currentObjectType.name}</strong>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Objects of type "{currentObjectType.name}" will be able to reference objects of type "{allObjectTypes.find(ot => ot.id === parentObjectType)?.name}"
          </p>
        </div>
      )}
    </div>
  );
};

export default HierarchyVisualization;