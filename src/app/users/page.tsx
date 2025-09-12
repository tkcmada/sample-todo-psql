'use client';

import { UserTable } from '@/components/UserTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users with Apps and Roles</h1>
          <p className="text-muted-foreground">
            Manage users and view their associated applications and roles
          </p>
        </div>
        <Button onClick={() => router.push('/users/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <UserTable />
    </div>
  );
}