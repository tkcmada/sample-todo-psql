'use client';

import { useRouter } from 'next/navigation';
import { UserForm } from '@/components/users/UserForm';
import { trpc } from '@/lib/trpc/client';

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const router = useRouter();
  const userId = params.id;
  
  const { data: user, isLoading, error } = trpc.user.getById.useQuery(
    { user_id: userId },
    { enabled: !!userId }
  );

  if (!userId) {
    router.push('/users');
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg">Loading user...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-destructive">
            User not found or error loading user
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserForm 
      mode="edit" 
      initialData={{
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        apps: user.apps,
        roles: user.roles,
      }} 
    />
  );
}