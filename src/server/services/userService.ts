import { userRepository } from '@/server/repositories/userRepository';
import type { UserWithAppsAndRoles as ClientUserType } from '@/lib/types';

export const userService = {
  getAll: async (): Promise<ClientUserType[]> => {
    const users = await userRepository.getAll();
    return users.map(user => ({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      created_at: user.created_at.toISOString(),
      apps: user.apps?.map(app => app.app_name) || [],
      roles: user.roles?.map(role => `${role.app_name}-${role.role}`) || [],
    }));
  },

  getById: async (user_id: string): Promise<ClientUserType | null> => {
    const user = await userRepository.getById(user_id);
    if (!user) return null;
    
    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      created_at: user.created_at.toISOString(),
      apps: user.apps?.map(app => app.app_name) || [],
      roles: user.roles?.map(role => `${role.app_name}-${role.role}`) || [],
    };
  },

  create: async (input: { user_id: string; name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }) => {
    return await userRepository.create(input);
  },

  update: async (input: { user_id: string; name?: string; email?: string; apps?: string[]; appRoles?: { app_name: string; role: string }[] }) => {
    return await userRepository.update(input);
  },

  delete: async (user_id: string) => {
    return await userRepository.delete(user_id);
  },
};

export type UserService = typeof userService;