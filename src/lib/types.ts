export type UserWithAppsAndRoles = {
  user_id: string;
  username: string;
  email: string;
  apps: string[];
  roles: string[];
};