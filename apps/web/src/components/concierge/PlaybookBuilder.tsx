import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Playbook, PlaybookFlowData, PlaybookNode, PlaybookNodeData } from '../../types/concierge';
import { conciergeService } from '../../services/conciergeService';
import toastService from '../../services/toastService';
import LoadingSpinner from '../LoadingSpinner';
import NodeLibrary from './NodeLibrary';
import NodeEditor from './NodeEditor';
import PlaybookPreview from './PlaybookPreview';
import { Trash2, Save, Play, Eye, Settings } from 'lucide-react';

interface PlaybookBuilderProps {
  playbook?: Playbook;
  onSave?: (playbook: Playbook) => void;
  onClose?: () => void;
}

const nodeTypes = {
  trigger: 'trigger',
  condition: 'condition', 
  action: 'action',
  enforcement: 'enforcement',
};

const PlaybookBuilder: React.FC<PlaybookBuilderProps> = ({
  playbook,
  onSave,
  onClose,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(playbook?.flowData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(playbook?.flowData?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [playbookName, setPlaybookName] = useState(playbook?.name || 'New Playbook');
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  // Custom node styles based on type
  const getNodeStyle = useCallback((nodeType: string, isValid: boolean = true) => {
    const baseStyle = {
      border: '2px solid',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '14px',
      fontWeight: '500',
      minWidth: '150px',
      textAlign: 'center' as const,
    };

    const typeStyles = {
      trigger: {
        background: isValid ? '#EF4444' : '#FCA5A5',
        borderColor: isValid ? '#DC2626' : '#F87171',
        color: 'white',
      },
      condition: {
        background: isValid ? '#F59E0B' : '#FCD34D',
        borderColor: isValid ? '#D97706' : '#FCD34D',
        color: 'white',
      },
      action: {
        background: isValid ? '#10B981' : '#6EE7B7',
        borderColor: isValid ? '#059669' : '#34D399',
        color: 'white',
      },
      enforcement: {
        background: isValid ? '#8B5CF6' : '#C4B5FD',
        borderColor: isValid ? '#7C3AED' : '#A78BFA',
        color: 'white',
      },
    };

    return {
      ...baseStyle,
      ...typeStyles[nodeType as keyof typeof typeStyles],
    };
  }, []);

  // Convert our nodes to React Flow format
  const reactFlowNodes = useMemo(() => 
    nodes.map((node: PlaybookNode) => ({
      id: node.id,
      type: 'default',
      position: node.position,
      data: {
        ...node.data,
        label: node.data.label,
      },
      style: getNodeStyle(node.type, node.data.isValid),
    }))
  , [nodes, getNodeStyle]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onInit = useCallback((instance: any) => {
    reactFlowInstance.current = instance;
  }, []);

  // Handle drag and drop from node library
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance.current) return;

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      const position = reactFlowInstance.current.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeId = `${nodeType}_${Date.now()}`;
      const newNode: PlaybookNode = {
        id: newNodeId,
        type: nodeType as 'trigger' | 'condition' | 'action' | 'enforcement',
        position,
        data: {
          label: `New ${nodeType}`,
          nodeType: nodeType as any,
          config: {},
          isValid: false,
          errors: ['Node configuration is required'],
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<PlaybookNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const validatePlaybook = useCallback(async () => {
    setIsValidating(true);
    try {
      const playbookData: Partial<Playbook> = {
        name: playbookName,
        flowData: {
          nodes: nodes as PlaybookNode[],
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            animated: edge.animated,
          })),
          viewport: reactFlowInstance.current?.getViewport(),
        },
      };

      const response = await conciergeService.validatePlaybook(playbookData);
      
      const errors: Record<string, string[]> = {};
      response.data.errors.forEach(error => {
        if (error.nodeId) {
          if (!errors[error.nodeId]) errors[error.nodeId] = [];
          errors[error.nodeId].push(error.message);
        }
      });
      
      setValidationErrors(errors);
      
      if (response.data.isValid) {
        toastService.success('Playbook validation passed');
      } else {
        toastService.error(`Validation failed with ${response.data.errors.length} errors`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toastService.error('Failed to validate playbook');
    } finally {
      setIsValidating(false);
    }
  }, [nodes, edges, playbookName]);

  const savePlaybook = useCallback(async () => {
    setIsSaving(true);
    try {
      const playbookData = {
        name: playbookName,
        trigger: 'manual' as const, // This should be derived from trigger nodes
        conditions: [],
        actions: [],
        enforcements: [],
        flowData: {
          nodes: nodes as PlaybookNode[],
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            animated: edge.animated,
          })),
          viewport: reactFlowInstance.current?.getViewport(),
        },
      };

      const response = playbook 
        ? await conciergeService.updatePlaybook(playbook.id, playbookData)
        : await conciergeService.createPlaybook(playbookData);

      toastService.success(`Playbook ${playbook ? 'updated' : 'created'} successfully`);
      onSave?.(response.data);
    } catch (error: any) {
      console.error('Failed to save playbook:', error);
      toastService.error(`Failed to ${playbook ? 'update' : 'create'} playbook`);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, playbookName, playbook, onSave]);

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
            onClick={validatePlaybook}
            disabled={isValidating}
            className="btn btn-secondary flex items-center space-x-2"
          >
            {isValidating ? <LoadingSpinner size="sm" /> : <Settings className="w-4 h-4" />}
            <span>Validate</span>
          </button>
          
          <button
            onClick={() => setShowPreview(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          
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
              className="btn btn-secondary"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Library Sidebar */}
        <div className="w-64 bg-white border-r">
          <NodeLibrary />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={reactFlowNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={onInit}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap />
              
              {/* Delete Button Panel */}
              {selectedNode && (
                <Panel position="top-right">
                  <button
                    onClick={() => onDeleteNode(selectedNode.id)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </Panel>
              )}
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 bg-white border-l">
            <NodeEditor
              node={selectedNode}
              onUpdate={(newData) => updateNodeData(selectedNode.id, newData)}
              validationErrors={validationErrors[selectedNode.id] || []}
            />
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PlaybookPreview
          playbook={{
            ...playbook,
            name: playbookName,
            flowData: {
              nodes: nodes as PlaybookNode[],
              edges: edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: edge.type,
                animated: edge.animated,
              })),
            },
          } as Playbook}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default PlaybookBuilder;