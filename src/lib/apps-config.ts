// Application and Role Configuration
export const APPS_CONFIG = {
  usermanager: {
    name: 'User Manager',
    description: 'User management and administration',
    roles: ['usermanager-approver', 'usermanager-admin']
  },
  quoteapp: {
    name: 'Quote App',
    description: 'Quote management application',
    roles: ['quoteapp-sales', 'quoteapp-trader']
  }
} as const;

export type AppName = keyof typeof APPS_CONFIG;
export type AppRole = typeof APPS_CONFIG[AppName]['roles'][number];

export const getAppNames = (): AppName[] => {
  return Object.keys(APPS_CONFIG) as AppName[];
};

export const getAppRoles = (appName: AppName): string[] => {
  return APPS_CONFIG[appName]?.roles || [];
};

export const getAllApps = () => {
  return Object.entries(APPS_CONFIG).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    roles: value.roles
  }));
};

export const getAppRole = (appName: string, role: string): string => {
  return `${appName}-${role}`;
};

export const parseAppRole = (appRole: string): { app: string; role: string } => {
  const parts = appRole.split('-');
  if (parts.length < 2) {
    throw new Error('Invalid app-role format. Expected: app-role');
  }
  const app = parts[0];
  const role = parts.slice(1).join('-'); // Handle roles with hyphens
  return { app, role };
};