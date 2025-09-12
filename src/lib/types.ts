import type { User } from '@/server/db/schema';
import type { AppRole } from './apps-config';

export type UserWithAppsAndRoles = Omit<User, 'created_at' | 'updated_at'> & {
  created_at: string;
  updated_at: string;
  Apps: string[];
  AppRoles: AppRole[];
};
