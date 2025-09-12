import { userRepository } from '@/server/repositories/userRepository';
import type { UserWithAppsAndRoles as ClientUserType } from '@/lib/types';

export const userService = {
  getAll: async (): Promise<ClientUserType[]> => {
    const users = await userRepository.getAll();
    return users.map(user => ({
      userid: user.id,
      username: user.name,
      email: user.email,
      apps: user.apps.map(app => app.app_name),
      roles: user.roles.map(role => `${role.app_name}-${role.role}`),
    }));
  },

  getById: async (id: number): Promise<ClientUserType | null> => {
    const user = await userRepository.getById(id);
    if (!user) return null;
    
    return {
      userid: user.id,
      username: user.name,
      email: user.email,
      apps: user.apps.map(app => app.app_name),
      roles: user.roles.map(role => `${role.app_name}-${role.role}`),
    };
  },

  create: async (input: { name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }) => {
    return await userRepository.create(input);
  },

  update: async (input: { id: number; name?: string; email?: string; apps?: string[]; appRoles?: { app_name: string; role: string }[] }) => {
    return await userRepository.update(input);
  },

  delete: async (id: number) => {
    return await userRepository.delete(id);
  },
};

export type UserService = typeof userService;