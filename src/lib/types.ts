export type UserWithAppsAndRoles = {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  apps: string[];
  roles: string[];
};