import { userRepository } from '@/server/repositories/userRepository';
import type { UserWithAppsAndRoles } from '@/lib/types';

export const userService = {
  getAll: async (): Promise<UserWithAppsAndRoles[]> => {
    return await userRepository.getAll();
  },

  getById: async (id: number): Promise<UserWithAppsAndRoles | null> => {
    return await userRepository.getById(id);
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
