export type UserWithAppsAndRoles = {
  userid: number;
  username: string;
  email: string;
  apps: string[];
  roles: string[];
};