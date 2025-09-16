import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, User } from 'lucide-react';

export interface PersonNodeData {
  user_id: string;
  name: string;
  position?: string;
  photo_url?: string;
  isEditMode: boolean;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  onSelect: (userId: string) => void;
}

export function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onEdit(data.user_id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete(data.user_id);
  };

  const handleSelect = () => {
    data.onSelect(data.user_id);
  };

  return (
    <div onClick={handleSelect}>
      <Card 
        className={`min-w-[180px] cursor-pointer transition-all duration-200 ${
          selected 
            ? 'ring-2 ring-blue-500 shadow-lg' 
            : 'hover:shadow-md'
        } ${
          data.isEditMode 
            ? 'hover:ring-1 hover:ring-gray-300' 
            : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center space-y-3">
            {/* Profile Picture */}
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={data.photo_url || undefined} 
                alt={data.name}
              />
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {data.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Name and Position */}
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-sm leading-tight">
                {data.name}
              </h3>
              {data.position && (
                <p className="text-xs text-gray-600 leading-tight">
                  {data.position}
                </p>
              )}
            </div>

            {/* Edit Mode Actions */}
            {data.isEditMode && (
              <div className="flex gap-1 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* React Flow Handles */}
          <Handle
            type="source"
            position={Position.Top}
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
          />
          <Handle
            type="target"
            position={Position.Bottom}
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
          />
        </CardContent>
      </Card>
    </div>
  );
}