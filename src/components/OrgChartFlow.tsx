'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { PersonNode, PersonNodeData } from './PersonNode';
import styles from './OrgChartFlow.module.css';

// Using any types for now to avoid complex tRPC serialization issues
type User = any;
type ChartData = {
  nodes: any[];
  edges: any[];
};

interface OrgChartFlowProps {
  users: User[];
  chartData: ChartData;
  isEditMode: boolean;
  onNodeDragStop?: (nodeId: string, position: { x: number; y: number }) => void;
  onConnect?: (connection: Connection) => void;
  onEdgeDelete?: (edgeId: string) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeEdit?: (userId: string) => void;
  onNodeDelete?: (userId: string) => void;
}

export function OrgChartFlow({
  users,
  chartData,
  isEditMode,
  onNodeDragStop,
  onConnect,
  onEdgeDelete,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
}: OrgChartFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Memoize nodeTypes to prevent recreation
  const nodeTypes = useMemo<NodeTypes>(() => ({
    person: PersonNode,
  }), []);

  // Memoize edgeTypes as well (empty object since we use default edges)
  const edgeTypes = useMemo(() => ({}), []);

  // Update nodes and edges when data changes
  useEffect(() => {
    // ユーザー情報を元にノードを生成または更新
    const newNodes: Node<PersonNodeData>[] = users.map((user) => {
      const savedNode = chartData.nodes.find(node => node.data?.user_id === user.user_id);
      const defaultPosition = savedNode?.position || { x: 200, y: 200 };

      return {
        id: user.user_id,
        type: 'person',
        position: defaultPosition,
        data: {
          user_id: user.user_id,
          name: user.name,
          position: user.position || undefined,
          photo_url: user.photo_url || undefined,
          isEditMode,
          onEdit: onNodeEdit || (() => {}),
          onDelete: onNodeDelete || (() => {}),
          onSelect: onNodeSelect || (() => {}),
        },
        draggable: isEditMode,
      };
    });

    // エッジはchartDataから直接使用
    const newEdges: Edge[] = (chartData.edges || []).map((edge: any) => ({
      ...edge,
      deletable: isEditMode,
      style: { 
        stroke: '#64748b', 
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#64748b',
      },
      // 選択時のスタイル
      data: {
        ...edge.data,
        selectedStyle: {
          stroke: '#ef4444',
          strokeWidth: 3,
        }
      }
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [users, chartData, isEditMode, onNodeEdit, onNodeDelete, onNodeSelect, setNodes, setEdges]);

  // Handle node drag end
  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (isEditMode && onNodeDragStop) {
        onNodeDragStop(node.id, node.position);
      }
    },
    [isEditMode, onNodeDragStop]
  );

  // Handle new connections (reporting lines)
  const handleConnect = useCallback(
    (params: Connection) => {
      if (isEditMode && params.source && params.target && params.source !== params.target) {
        onConnect?.(params);
      }
    },
    [isEditMode, onConnect]
  );

  // Connection validation
  const isValidConnection = useCallback((connection: Connection) => {
    // Prevent self-connections
    if (connection.source === connection.target) {
      return false;
    }
    
    // Allow all other connections for now
    return true;
  }, []);

  // Handle edge deletion
  const handleEdgesDelete = useCallback(
    (edges: Edge[]) => {
      edges.forEach((edge) => {
        onEdgeDelete?.(edge.id);
      });
    },
    [onEdgeDelete]
  );

  return (
    <div className={`w-full h-full ${styles.orgChartFlow}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        onEdgesDelete={handleEdgesDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineStyle={{ stroke: '#64748b', strokeWidth: 2 }}
        isValidConnection={isValidConnection}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        deleteKeyCode={isEditMode ? ['Backspace', 'Delete'] : undefined}
        multiSelectionKeyCode={isEditMode ? ['Meta', 'Ctrl'] : null}
        panOnDrag={!isEditMode ? true : [32]}
        elementsSelectable={isEditMode}
        nodesConnectable={isEditMode}
        nodesDraggable={isEditMode}
        edgesFocusable={isEditMode}
        edgesUpdatable={isEditMode}
        attributionPosition="bottom-left"
      >
        <Controls showInteractive={isEditMode} />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}