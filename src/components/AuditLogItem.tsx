'use client';

import type { AuditLog } from '@/server/db/schema';
import { Plus, Edit3, ToggleLeft, Trash2 } from 'lucide-react';

interface AuditLogItemProps {
  auditLog: AuditLog;
}

function getActionIcon(action: string) {
  switch (action) {
    case 'CREATE':
      return <Plus className="h-3 w-3 text-green-500" />;
    case 'UPDATE':
      return <Edit3 className="h-3 w-3 text-blue-500" />;
    case 'TOGGLE':
      return <ToggleLeft className="h-3 w-3 text-purple-500" />;
    case 'DELETE':
      return <Trash2 className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
}

function getActionText(action: string, oldValues: any, newValues: any) {
  switch (action) {
    case 'CREATE':
      return 'TODOを作成しました';
    case 'UPDATE':
      return 'TODOを更新しました';
    case 'TOGGLE':
      if (oldValues?.done_flag === false && newValues?.done_flag === true) {
        return '完了にしました';
      } else if (oldValues?.done_flag === true && newValues?.done_flag === false) {
        return '未完了に戻しました';
      }
      return 'ステータスを切り替えました';
    case 'DELETE':
      return 'TODOを削除しました';
    default:
      return '不明な操作';
  }
}

function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'たった今';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}時間前`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}日前`;
  }
}

function renderValueChanges(action: string, oldValues: any, newValues: any) {
  if (!oldValues && !newValues) return null;
  
  const oldVal = oldValues ? JSON.parse(oldValues) : null;
  const newVal = newValues ? JSON.parse(newValues) : null;
  
  if (action === 'CREATE') {
    return (
      <div className="text-xs text-gray-600 mt-1">
        <span className="font-medium">作成内容:</span>
        <div className="ml-2">
          <div>タイトル: {newVal?.title}</div>
          {newVal?.due_date && <div>期限: {newVal.due_date}</div>}
        </div>
      </div>
    );
  }
  
  if (action === 'UPDATE' && oldVal && newVal) {
    const changes = [];
    if (oldVal.title !== newVal.title) {
      changes.push(`タイトル: "${oldVal.title}" → "${newVal.title}"`);
    }
    if (oldVal.due_date !== newVal.due_date) {
      changes.push(`期限: ${oldVal.due_date || '未設定'} → ${newVal.due_date || '未設定'}`);
    }
    
    if (changes.length > 0) {
      return (
        <div className="text-xs text-gray-600 mt-1">
          <span className="font-medium">変更内容:</span>
          <div className="ml-2">
            {changes.map((change, index) => (
              <div key={index}>{change}</div>
            ))}
          </div>
        </div>
      );
    }
  }
  
  if (action === 'TOGGLE' && oldVal && newVal) {
    return (
      <div className="text-xs text-gray-600 mt-1">
        <span className="font-medium">ステータス:</span> {oldVal.done_flag ? '完了' : '未完了'} → {newVal.done_flag ? '完了' : '未完了'}
      </div>
    );
  }
  
  return null;
}

export function AuditLogItem({ auditLog }: AuditLogItemProps) {
  const oldValues = auditLog.old_values ? JSON.parse(auditLog.old_values) : null;
  const newValues = auditLog.new_values ? JSON.parse(auditLog.new_values) : null;
  
  return (
    <div className="flex items-start gap-2 py-2 px-3 bg-gray-50 rounded-md">
      <div className="mt-0.5">
        {getActionIcon(auditLog.action)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span>{getActionText(auditLog.action, oldValues, newValues)}</span>
          <span className="text-gray-500 text-xs">
            {formatDate(auditLog.created_at)}
          </span>
        </div>
        {renderValueChanges(auditLog.action, auditLog.old_values, auditLog.new_values)}
      </div>
    </div>
  );
}