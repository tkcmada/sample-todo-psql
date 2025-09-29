import { pgTable, serial, text, date, boolean, timestamp, integer, varchar, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const todo = pgTable('todo', {
  id: serial('id').primaryKey().notNull(),
  title: text('title').notNull(),
  due_date: date('due_date'),
  done_flag: boolean('done_flag').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  deleted_at: timestamp('deleted_at'),
});

export const audit_log = pgTable('audit_log', {
  id: serial('id').primaryKey().notNull(),
  todo_id: integer('todo_id').notNull().references(() => todo.id),
  action: text('action').notNull(),
  old_values: text('old_values'),
  new_values: text('new_values'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const user = pgTable('user', {
  user_id: varchar('user_id', { length: 256 }).primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  position: text('position'),
  photo_url: text('photo_url'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const user_app = pgTable('user_app', {
  id: serial('id').primaryKey().notNull(),
  user_id: varchar('user_id', { length: 256 }).notNull().references(() => user.user_id),
  app_name: text('app_name').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const user_role = pgTable('user_role', {
  id: serial('id').primaryKey().notNull(),
  user_id: varchar('user_id', { length: 256 }).notNull().references(() => user.user_id),
  app_name: text('app_name').notNull(),
  role: text('role').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const team_structure_page = pgTable('team_structure_page', {
  id: serial('id').primaryKey().notNull(),
  page_name: text('page_name').notNull(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  chart_data: jsonb('chart_data').notNull().default('{"nodes": [], "edges": []}'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const audit_logRelations = relations(audit_log, ({ one, many }) => ({
  todo: one(todo, {
    fields: [audit_log.todo_id],
    references: [todo.id],
  }),
}));

export const todoRelations = relations(todo, ({ one, many }) => ({
  audit_log: many(audit_log),
}));

export const user_appRelations = relations(user_app, ({ one, many }) => ({
  user: one(user, {
    fields: [user_app.user_id],
    references: [user.user_id],
  }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  user_app: many(user_app),
  user_role: many(user_role),
}));

export const user_roleRelations = relations(user_role, ({ one, many }) => ({
  user: one(user, {
    fields: [user_role.user_id],
    references: [user.user_id],
  }),
}));

// Types are now generated from DBML schema - see src/lib/types-generated.ts
// Import types from '@/lib/types-generated' instead of this file
