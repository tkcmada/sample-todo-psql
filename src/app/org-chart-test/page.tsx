'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit3 } from 'lucide-react';
import { OrgChartFlow } from '@/components/OrgChartFlow';

// ローカルテストデータ
const mockUsers = [
  { user_id: 'user_1', name: '田中太郎', position: 'CEO', photo_url: null },
  { user_id: 'user_2', name: '佐藤花子', position: 'CTO', photo_url: null },
  { user_id: 'user_3', name: '鈴木一郎', position: 'エンジニアリングマネージャー', photo_url: null },
];

const initialChartData = {
  nodes: [
    { id: 'user_1', type: 'person', position: { x: 200, y: 100 }, data: { user_id: 'user_1' } },
    { id: 'user_2', type: 'person', position: { x: 400, y: 200 }, data: { user_id: 'user_2' } },
    { id: 'user_3', type: 'person', position: { x: 100, y: 300 }, data: { user_id: 'user_3' } },
  ],
  edges: [],
};

export default function OrgChartTestPage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [chartData, setChartData] = useState(initialChartData);

  return (
    <div className="h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">チーム体制図テスト</h1>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-mode"
              checked={isEditMode}
              onCheckedChange={setIsEditMode}
            />
            <Label htmlFor="edit-mode" className="flex items-center gap-1">
              <Edit3 className="h-4 w-4" />
              編集モード
            </Label>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 h-full">
        <OrgChartFlow
          users={mockUsers}
          chartData={chartData}
          isEditMode={isEditMode}
          onConnect={(connection) => {
            const newEdge = {
              id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
              source: connection.source,
              target: connection.target,
              type: 'smoothstep',
            };
            setChartData(prev => ({
              ...prev,
              edges: [...prev.edges, newEdge]
            }));
          }}
          onNodeDragStop={(nodeId, position) => {
            setChartData(prev => ({
              ...prev,
              nodes: prev.nodes.map(node => 
                node.id === nodeId 
                  ? { ...node, position }
                  : node
              )
            }));
          }}
          onEdgeDelete={(edgeId) => {
            setChartData(prev => ({
              ...prev,
              edges: prev.edges.filter(edge => edge.id !== edgeId)
            }));
          }}
        />
      </div>
    </div>
  );
}