'use client';

import { UserTable } from '@/components/UserTable';

export default function UsersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users with Apps and Roles</h1>
        <p className="text-muted-foreground">
          Manage users and view their associated applications and roles
        </p>
      </div>
      
      <UserTable />
    </div>
  );
}