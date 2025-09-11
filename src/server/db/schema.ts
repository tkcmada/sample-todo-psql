import { pgTable, serial, text, date, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  due_date: date('due_date'),
  done_flag: boolean('done_flag').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  todo_id: integer('todo_id').notNull().references(() => todos.id),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'TOGGLE', 'DELETE'
  old_values: text('old_values'), // JSON文字列: 変更前の値
  new_values: text('new_values'), // JSON文字列: 変更後の値
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const userApps = pgTable('user_apps', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  app_name: text('app_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  role: text('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const todosRelations = relations(todos, ({ many }) => ({
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  todo: one(todos, {
    fields: [auditLogs.todo_id],
    references: [todos.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  apps: many(userApps),
  roles: many(userRoles),
}));

export const userAppsRelations = relations(userApps, ({ one }) => ({
  user: one(users, {
    fields: [userApps.user_id],
    references: [users.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.user_id],
    references: [users.id],
  }),
}));

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type TodoWithAuditLogs = Todo & {
  auditLogs: AuditLog[];
};

export type User = typeof users.$inferSelect;
export type UserApp = typeof userApps.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;

export type UserWithAppsAndRoles = User & {
  apps: UserApp[];
  roles: UserRole[];
};

// Serialized types for tRPC (Date -> string)
export type TodoSerialized = Omit<Todo, 'created_at' | 'updated_at' | 'deleted_at'> & {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AuditLogSerialized = Omit<AuditLog, 'created_at'> & {
  created_at: string;
};

export type TodoWithAuditLogsSerialized = Omit<TodoSerialized, 'auditLogs'> & {
  auditLogs: AuditLogSerialized[];
};
