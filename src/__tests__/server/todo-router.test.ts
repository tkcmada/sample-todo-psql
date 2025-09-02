import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCallerFactory } from '@trpc/server';
import { todoRouter } from '@/server/api/routers/todo';
import { db } from '@/server/db';
import { auditLogs } from '@/server/db/schema';

const mockTodos = [
  {
    id: 1,
    title: 'Test Todo 1',
    due_date: '2024-12-31',
    done_flag: false,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    auditLogs: [],
  },
  {
    id: 2,
    title: 'Test Todo 2',
    due_date: null,
    done_flag: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    auditLogs: [],
  },
];

const mockDeletedTodo = {
  id: 3,
  title: 'Deleted Todo',
  due_date: null,
  done_flag: false,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: new Date(),
};

// Mock the database module
vi.mock('@/server/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      todos: {
        findMany: vi.fn(),
      },
    },
  },
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
  desc: vi.fn((column) => ({ column, type: 'desc' })),
  isNull: vi.fn((column) => ({ column, type: 'isNull' })),
  relations: vi.fn(() => ({})),
}));

describe('Todo Router', () => {
  const createCaller = createCallerFactory();
  const caller = createCaller(todoRouter)({
    req: {} as any, // Mock NextRequest
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return only non-deleted todos with audit logs', async () => {
      vi.mocked(db.query.todos.findMany).mockResolvedValue(mockTodos as any);

      const result = await caller.getAll();

      expect(db.query.todos.findMany).toHaveBeenCalledWith({
        where: expect.any(Object), // isNull(todos.deleted_at)
        with: {
          auditLogs: {
            orderBy: expect.any(Object),
          },
        },
        orderBy: expect.any(Object),
      });
      expect(result).toEqual(mockTodos);
    });
  });

  describe('create', () => {
    it('should create a new todo and audit log', async () => {
      const newTodo = mockTodos[0];
      const input = {
        title: 'Test Todo 1',
        due_date: '2024-12-31',
      };

      // Mock todo creation
      const todoReturningMock = vi.fn().mockResolvedValue([newTodo]);
      const todoValuesMock = vi.fn().mockReturnValue({ returning: todoReturningMock });
      
      // Mock audit log creation
      const auditReturningMock = vi.fn().mockResolvedValue([{ id: 1 }]);
      const auditValuesMock = vi.fn().mockReturnValue({ returning: auditReturningMock });
      
      vi.mocked(db.insert).mockImplementation((table) => {
        if (table === auditLogs) {
          return { values: auditValuesMock } as any;
        }
        return { values: todoValuesMock } as any;
      });

      const result = await caller.create(input);

      expect(db.insert).toHaveBeenCalledTimes(2); // todos and audit_logs
      expect(todoValuesMock).toHaveBeenCalledWith({
        title: input.title,
        due_date: input.due_date,
      });
      expect(result).toEqual(newTodo);
    });

    it('should create a todo with null due_date', async () => {
      const newTodo = { ...mockTodos[1], title: 'Test Todo No Date' };
      const input = {
        title: 'Test Todo No Date',
        due_date: null,
      };

      const returningMock = vi.fn().mockResolvedValue([newTodo]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      vi.mocked(db.insert).mockReturnValue({ values: valuesMock } as any);

      const result = await caller.create(input);

      expect(valuesMock).toHaveBeenCalledWith({
        title: input.title,
        due_date: null,
      });
      expect(result).toEqual(newTodo);
    });
  });

  describe('update', () => {
    it('should update a todo successfully', async () => {
      const existingTodo = mockTodos[0];
      const updatedTodo = { ...existingTodo, title: 'Updated Todo' };
      const input = {
        id: 1,
        title: 'Updated Todo',
        due_date: '2024-12-31',
      };

      // Mock select for checking existing todo
      const selectWhereMock = vi.fn().mockResolvedValue([existingTodo]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      vi.mocked(db.select).mockReturnValue({ from: selectFromMock } as any);

      // Mock update
      const updateReturningMock = vi.fn().mockResolvedValue([updatedTodo]);
      const updateWhereMock = vi.fn().mockReturnValue({ returning: updateReturningMock });
      const updateSetMock = vi.fn().mockReturnValue({ where: updateWhereMock });
      vi.mocked(db.update).mockReturnValue({ set: updateSetMock } as any);

      const result = await caller.update(input);

      expect(db.select).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
      expect(updateSetMock).toHaveBeenCalledWith({
        title: input.title,
        due_date: input.due_date,
        updated_at: expect.any(Date),
      });
      expect(result).toEqual(updatedTodo);
    });

    it('should throw error if todo is deleted', async () => {
      const input = {
        id: 3,
        title: 'Updated Todo',
        due_date: '2024-12-31',
      };

      const selectWhereMock = vi.fn().mockResolvedValue([mockDeletedTodo]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      vi.mocked(db.select).mockReturnValue({ from: selectFromMock } as any);

      await expect(caller.update(input)).rejects.toThrow('Todo not found or has been deleted');
    });
  });

  describe('delete', () => {
    it('should logically delete a todo successfully', async () => {
      const input = { id: 1 };

      // Mock update for logical delete (not physical delete)
      const whereMock = vi.fn().mockResolvedValue(undefined);
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      vi.mocked(db.update).mockReturnValue({ set: setMock } as any);

      const result = await caller.delete(input);

      expect(vi.mocked(db.update)).toHaveBeenCalled(); // Should use update, not delete
      expect(setMock).toHaveBeenCalledWith({ deleted_at: expect.any(Date) });
      expect(whereMock).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('toggle', () => {
    it('should toggle todo completion status', async () => {
      const existingTodo = mockTodos[0];
      const toggledTodo = { ...existingTodo, done_flag: true };
      const input = { id: 1 };

      // Mock select for finding existing todo
      const selectWhereMock = vi.fn().mockResolvedValue([existingTodo]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      vi.mocked(db.select).mockReturnValue({ from: selectFromMock } as any);

      // Mock update for toggling
      const updateReturningMock = vi.fn().mockResolvedValue([toggledTodo]);
      const updateWhereMock = vi.fn().mockReturnValue({ returning: updateReturningMock });
      const updateSetMock = vi.fn().mockReturnValue({ where: updateWhereMock });
      vi.mocked(db.update).mockReturnValue({ set: updateSetMock } as any);

      const result = await caller.toggle(input);

      expect(vi.mocked(db.select)).toHaveBeenCalled();
      expect(selectFromMock).toHaveBeenCalled();
      expect(selectWhereMock).toHaveBeenCalled();
      
      expect(vi.mocked(db.update)).toHaveBeenCalled();
      expect(updateSetMock).toHaveBeenCalledWith({
        done_flag: !existingTodo.done_flag,
        updated_at: expect.any(Date),
      });
      expect(result).toEqual(toggledTodo);
    });

    it('should throw error if todo not found', async () => {
      const input = { id: 999 };

      const selectWhereMock = vi.fn().mockResolvedValue([]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      vi.mocked(db.select).mockReturnValue({ from: selectFromMock } as any);

      await expect(caller.toggle(input)).rejects.toThrow('Todo not found or has been deleted');
    });

    it('should throw error if todo is deleted', async () => {
      const input = { id: 3 };

      const selectWhereMock = vi.fn().mockResolvedValue([mockDeletedTodo]);
      const selectFromMock = vi.fn().mockReturnValue({ where: selectWhereMock });
      vi.mocked(db.select).mockReturnValue({ from: selectFromMock } as any);

      await expect(caller.toggle(input)).rejects.toThrow('Todo not found or has been deleted');
    });
  });
});