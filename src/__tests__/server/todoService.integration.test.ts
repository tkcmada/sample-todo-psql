import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as schema from '@/server/db/schema';

let pg: PGlite;
let db: ReturnType<typeof drizzle>;

describe('TodoService Integration Tests with PGlite', () => {
  beforeAll(async () => {
    pg = new PGlite();
    db = drizzle(pg, { schema });

    // Run migrations from actual migration files to ensure schema consistency
    const migrationPath = join(process.cwd(), 'drizzle', 'migrations');

    // Apply todos table migration
    const todosMigration = readFileSync(join(migrationPath, '0000_blushing_landau.sql'), 'utf-8');
    await pg.exec(todosMigration);

    // Apply audit_logs table migration and add deleted_at to todos
    const auditLogsMigration = readFileSync(join(migrationPath, '0001_classy_energizer.sql'), 'utf-8');
    await pg.exec(auditLogsMigration);
  });

  beforeEach(async () => {
    // Mock the database connection to use our test database
    vi.resetModules();
    vi.doMock('@/server/db', () => ({ db }));

    // Clear all data
    await db.delete(schema.auditLogs);
    await db.delete(schema.todos);
  });

  // Setup method to create a test todo
  async function setup_existingTodo(title = 'Test Todo', due_date: string | null = null) {
    const { todoService: service } = await import('@/server/services/todoService');
    return await service.create({ title, due_date });
  }

  afterAll(async () => {
    await pg.close();
  });

  describe('CRUD operations', () => {
    it('should create todo with correct properties', async () => {
      // Given: Service is available
      const { todoService: service } = await import('@/server/services/todoService');

      // When: Creating a new todo
      const newTodo = await service.create({ title: 'Service Test Todo', due_date: null });

      // Then: Todo is created with expected properties
      expect(newTodo.title).toBe('Service Test Todo');
      expect(newTodo.done_flag).toBe(false);
      expect(newTodo.due_date).toBeNull();
    });

    it('should retrieve all todos including audit logs', async () => {
      // Given: A todo exists in the database
      await setup_existingTodo('Existing Todo');
      const { todoService: service } = await import('@/server/services/todoService');

      // When: Getting all todos
      const allTodos = await service.getAll();

      // Then: Retrieved todos include audit logs
      expect(allTodos).toHaveLength(1);
      expect(allTodos[0].title).toBe('Existing Todo');
      expect(allTodos[0].auditLogs).toHaveLength(1);
      expect(allTodos[0].auditLogs[0].action).toBe('CREATE');
    });

    it('should update todo with new values', async () => {
      // Given: A todo exists in the database
      const created = await setup_existingTodo('Original Title');
      const { todoService: service } = await import('@/server/services/todoService');

      // When: Updating the todo
      const updated = await service.update({
        id: created.id,
        title: 'Updated Title',
        due_date: '2024-12-31'
      });

      // Then: Todo is updated with new values
      expect(updated.title).toBe('Updated Title');
      expect(updated.due_date).toBe('2024-12-31');
    });

    it('should create audit log when updating todo', async () => {
      // Given: A todo exists in the database
      const created = await setup_existingTodo('Original');
      const { todoService: service } = await import('@/server/services/todoService');

      // When: Updating the todo
      await service.update({ id: created.id, title: 'Updated' });

      // Then: Audit log is created for the update
      const allTodos = await service.getAll();
      expect(allTodos[0].auditLogs).toHaveLength(2);
      expect(allTodos[0].auditLogs[0].action).toBe('UPDATE'); // Most recent first
    });

    it('should soft delete todo successfully', async () => {
      // Given: A todo exists in the database
      const created = await setup_existingTodo('To Delete');
      const { todoService: service } = await import('@/server/services/todoService');

      // When: Deleting the todo
      const result = await service.delete(created.id);

      // Then: Delete operation returns success
      expect(result).toEqual({ success: true });
    });

    it('should not return soft deleted todos in getAll', async () => {
      // Given: A todo exists and is deleted
      const created = await setup_existingTodo('To Delete');
      const { todoService: service } = await import('@/server/services/todoService');
      await service.delete(created.id);

      // When: Getting all todos
      const allTodos = await service.getAll();

      // Then: Deleted todo is not returned
      expect(allTodos).toHaveLength(0);
    });

    it('should toggle todo done flag to true', async () => {
      // Given: A todo exists with done_flag false
      const created = await setup_existingTodo('To Toggle');
      const { todoService: service } = await import('@/server/services/todoService');
      expect(created.done_flag).toBe(false);

      // When: Toggling the todo
      const toggled = await service.toggle(created.id);

      // Then: Done flag is set to true
      expect(toggled.done_flag).toBe(true);
    });

    it('should toggle todo done flag back to false', async () => {
      // Given: A todo exists with done_flag true
      const created = await setup_existingTodo('To Toggle Back');
      const { todoService: service } = await import('@/server/services/todoService');
      await service.toggle(created.id); // First toggle to true

      // When: Toggling again
      const toggledBack = await service.toggle(created.id);

      // Then: Done flag is set to false
      expect(toggledBack.done_flag).toBe(false);
    });

    it('should create audit logs for toggle operations', async () => {
      // Given: A todo exists
      const created = await setup_existingTodo('Audit Toggle Test');
      const { todoService: service } = await import('@/server/services/todoService');
      await service.toggle(created.id);

      // When: Getting all todos
      const allTodos = await service.getAll();

      // Then: Audit logs include both CREATE and TOGGLE actions
      expect(allTodos[0].auditLogs).toHaveLength(2);
      expect(allTodos[0].auditLogs[0].action).toBe('TOGGLE'); // Most recent first
      expect(allTodos[0].auditLogs[1].action).toBe('CREATE');
    });
  });

  describe('error scenarios', () => {
    it('throws error when updating non-existent todo', async () => {
      const { todoService: service } = await import('@/server/services/todoService');

      await expect(service.update({ id: 999, title: 'Does not exist' }))
        .rejects.toThrow('Todo not found or has been deleted');
    });

    it('throws error when toggling non-existent todo', async () => {
      const { todoService: service } = await import('@/server/services/todoService');

      await expect(service.toggle(999))
        .rejects.toThrow('Todo not found or has been deleted');
    });
  });
});