import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCallerFactory } from '@trpc/server';
import { todoRouter } from '@/server/api/routers/todo';

// Mock the database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockTodos = [
  {
    id: 1,
    title: 'Test Todo 1',
    due_date: '2024-12-31',
    done_flag: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    title: 'Test Todo 2',
    due_date: null,
    done_flag: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Mock the database module
vi.mock('@/server/db', () => ({
  db: mockDb,
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
  desc: vi.fn((column) => ({ column, type: 'desc' })),
}));

describe('Todo Router', () => {
  const createCaller = createCallerFactory(todoRouter);
  const caller = createCaller({});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all todos ordered by created_at desc', async () => {
      // Setup mock chain
      const orderByMock = vi.fn().mockResolvedValue(mockTodos);
      const fromMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await caller.getAll();

      expect(mockDb.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalled();
      expect(orderByMock).toHaveBeenCalled();
      expect(result).toEqual(mockTodos);
    });
  });

  describe('create', () => {
    it('should create a new todo with valid data', async () => {
      const newTodo = mockTodos[0];
      const input = {
        title: 'Test Todo 1',
        due_date: '2024-12-31',
      };

      // Setup mock chain
      const returningMock = vi.fn().mockResolvedValue([newTodo]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const result = await caller.create(input);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(valuesMock).toHaveBeenCalledWith({
        title: input.title,
        due_date: input.due_date,
      });
      expect(returningMock).toHaveBeenCalled();
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
      mockDb.insert.mockReturnValue({ values: valuesMock });

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
      const updatedTodo = { ...mockTodos[0], title: 'Updated Todo' };
      const input = {
        id: 1,
        title: 'Updated Todo',
        due_date: '2024-12-31',
      };

      const returningMock = vi.fn().mockResolvedValue([updatedTodo]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await caller.update(input);

      expect(mockDb.update).toHaveBeenCalled();
      expect(setMock).toHaveBeenCalledWith({
        title: input.title,
        due_date: input.due_date,
        updated_at: expect.any(Date),
      });
      expect(whereMock).toHaveBeenCalled();
      expect(result).toEqual(updatedTodo);
    });
  });

  describe('delete', () => {
    it('should delete a todo successfully', async () => {
      const input = { id: 1 };

      const whereMock = vi.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({ where: whereMock });

      const result = await caller.delete(input);

      expect(mockDb.delete).toHaveBeenCalled();
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
      mockDb.select.mockReturnValue({ from: selectFromMock });

      // Mock update for toggling
      const updateReturningMock = vi.fn().mockResolvedValue([toggledTodo]);
      const updateWhereMock = vi.fn().mockReturnValue({ returning: updateReturningMock });
      const updateSetMock = vi.fn().mockReturnValue({ where: updateWhereMock });
      mockDb.update.mockReturnValue({ set: updateSetMock });

      const result = await caller.toggle(input);

      expect(mockDb.select).toHaveBeenCalled();
      expect(selectFromMock).toHaveBeenCalled();
      expect(selectWhereMock).toHaveBeenCalled();
      
      expect(mockDb.update).toHaveBeenCalled();
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
      mockDb.select.mockReturnValue({ from: selectFromMock });

      await expect(caller.toggle(input)).rejects.toThrow('Todo not found');
    });
  });
});