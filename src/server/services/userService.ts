import { userRepository } from '@/server/repositories/userRepository';
import type { UserWithAppsAndRoles as ClientUserType } from '@/lib/types';

export const userService = {
  getAll: async (): Promise<ClientUserType[]> => {
    const users = await userRepository.getAll();
    return users.map(user => ({
      userid: user.id,
      username: user.name,
      apps: user.apps.map(app => app.app_name),
      roles: user.roles.map(role => role.role),
    }));
  },

  getById: async (id: number): Promise<ClientUserType | null> => {
    const user = await userRepository.getById(id);
    if (!user) return null;
    
    return {
      userid: user.id,
      username: user.name,
      apps: user.apps.map(app => app.app_name),
      roles: user.roles.map(role => role.role),
    };
  },
};

export type UserService = typeof userService;