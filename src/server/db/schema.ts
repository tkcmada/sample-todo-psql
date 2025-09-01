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

export const todosRelations = relations(todos, ({ many }) => ({
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  todo: one(todos, {
    fields: [auditLogs.todo_id],
    references: [todos.id],
  }),
}));

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type TodoWithAuditLogs = Todo & {
  auditLogs: AuditLog[];
};