'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit3, Users, Save } from 'lucide-react';
import { OrgChartFlow } from '@/components/OrgChartFlow';

export default function OrgChartPage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data: users, isLoading: usersLoading } = trpc.orgChart.getAllUsers.useQuery();
  const { data: pages, isLoading: pagesLoading } = trpc.orgChart.getAllPages.useQuery();
  const _saveChartData = trpc.orgChart.saveChartData.useMutation();
  
  // デフォルトで最初のページを使用、なければ空のページを作成
  const currentPage = pages?.[0] || { id: 0, chart_data: { nodes: [], edges: [] } };

  if (usersLoading || pagesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">チーム体制図を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <Card className="border-b rounded-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              チーム体制図
            </CardTitle>
            <div className="flex items-center gap-4">
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
              <div className="flex gap-2">
                {isEditMode && (
                  <Button size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 flex">
        {/* Main Chart Area */}
        <div className="flex-1 relative">
          <Card className="h-full border-0 rounded-none">
            <CardContent className="h-full p-0">
              <OrgChartFlow
                users={users || []}
                chartData={currentPage.chart_data as any}
                isEditMode={isEditMode}
                onNodeSelect={setSelectedNode}
                onNodeEdit={(userId) => {
                  console.log('Edit user:', userId);
                  // TODO: Open edit modal
                }}
                onNodeDelete={(userId) => {
                  console.log('Delete user:', userId);
                  // TODO: Confirm and delete user
                }}
                onConnect={(connection) => {
                  console.log('New connection:', connection);
                  // TODO: Create reporting line
                }}
                onNodeDragStop={(nodeId, position) => {
                  console.log('Node moved:', nodeId, position);
                  // TODO: Update position in database
                }}
                onEdgeDelete={(edgeId) => {
                  console.log('Delete edge:', edgeId);
                  // TODO: Delete reporting line
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (Edit Mode Only) */}
        {isEditMode && (
          <Card className="w-80 border-l rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">編集パネル</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">人の管理</h3>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  新しい人を追加
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">選択中の人</h3>
                {selectedNode ? (
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm">選択中: {users?.find((u: any) => u.user_id === selectedNode)?.name || selectedNode}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">編集</Button>
                      <Button size="sm" variant="destructive">削除</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">人カードを選択してください</p>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">レポーティングライン</h3>
                <p className="text-sm text-gray-600 mb-2">
                  カードからカードへドラッグして線を描画
                </p>
                <div className="space-y-2">
                  {((currentPage.chart_data as any)?.edges || []).slice(0, 3).map((edge: any) => (
                    <div key={edge.id} className="p-2 border rounded text-xs">
                      {edge.source} → {edge.target}
                    </div>
                  ))}
                  {((currentPage.chart_data as any)?.edges?.length || 0) > 3 && (
                    <p className="text-xs text-gray-500">
                      他 {((currentPage.chart_data as any)?.edges?.length || 0) - 3} 本...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}