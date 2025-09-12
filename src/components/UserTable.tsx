'use client';

import { trpc } from '@/lib/trpc/client';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/users/columns';

export function UserTable() {
  const { data: users, isLoading, error } = trpc.user.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-destructive">Error loading users</div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-muted-foreground">
          No users available.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Search users..."
      />
    </div>
  );
}
