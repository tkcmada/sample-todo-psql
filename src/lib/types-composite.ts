// Composite types for relationships
// These types represent business logic relationships and are defined manually
// They extend the generated base types with relationship data

import type { TodoType, AuditLogType, UserType, UserAppType, UserRoleType } from './types-generated';

// Todo with its audit logs
export interface TodoWithAuditLogs extends TodoType {
  auditLogs: AuditLogType[];
}

// User with apps and roles (for frontend display)
export interface UserWithAppsAndRoles extends UserType {
  apps: UserAppType[];
  roles: UserRoleType[];
}