// Database layer types with Date objects (for repository layer)
// These types match what Drizzle returns from the database
// Generated from DBML schema but adapted for database operations

import type {
  TodoType,
  AuditLogType,
  UserType,
  UserAppType,
  UserRoleType,
  TeamStructurePageType
} from './types-generated';

// Database types with Date objects instead of strings
export interface TodoDB extends Omit<TodoType, 'created_at' | 'updated_at' | 'deleted_at'> {
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface AuditLogDB extends Omit<AuditLogType, 'created_at'> {
  created_at: Date;
}

export interface UserDB extends Omit<UserType, 'created_at' | 'updated_at'> {
  created_at: Date;
  updated_at: Date;
}

export interface UserAppDB extends Omit<UserAppType, 'created_at'> {
  created_at: Date;
}

export interface UserRoleDB extends Omit<UserRoleType, 'created_at'> {
  created_at: Date;
}

export interface TeamStructurePageDB extends Omit<TeamStructurePageType, 'created_at' | 'updated_at'> {
  created_at: Date;
  updated_at: Date;
}

// Composite database types
export interface TodoWithAuditLogsDB extends TodoDB {
  auditLogs: AuditLogDB[];
}

export interface UserWithAppsAndRolesDB extends UserDB {
  user_apps: UserAppDB[];
  user_roles: UserRoleDB[];
}

// Type conversion utilities
export function serializeTodo(todo: TodoDB): TodoType {
  return {
    ...todo,
    created_at: todo.created_at.toISOString(),
    updated_at: todo.updated_at.toISOString(),
    deleted_at: todo.deleted_at?.toISOString() ?? null,
  };
}

export function serializeAuditLog(auditLog: AuditLogDB): AuditLogType {
  return {
    ...auditLog,
    created_at: auditLog.created_at.toISOString(),
  };
}

export function serializeTodoWithAuditLogs(todo: TodoWithAuditLogsDB): import('./types-composite').TodoWithAuditLogs {
  return {
    ...serializeTodo(todo),
    auditLogs: todo.auditLogs.map(serializeAuditLog),
  };
}

export function serializeUser(user: UserDB): UserType {
  return {
    ...user,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };
}

export function serializeUserApp(userApp: UserAppDB): UserAppType {
  return {
    ...userApp,
    created_at: userApp.created_at.toISOString(),
  };
}

export function serializeUserRole(userRole: UserRoleDB): UserRoleType {
  return {
    ...userRole,
    created_at: userRole.created_at.toISOString(),
  };
}

export function serializeUserWithAppsAndRoles(user: UserWithAppsAndRolesDB): import('./types-composite').UserWithAppsAndRoles {
  return {
    ...serializeUser(user),
    apps: user.user_apps.map(serializeUserApp),
    roles: user.user_roles.map(serializeUserRole),
  };
}