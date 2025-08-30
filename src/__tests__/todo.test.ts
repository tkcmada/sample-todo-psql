import { describe, it, expect } from 'vitest';
import { createTodoSchema, updateTodoSchema, deleteTodoSchema } from '@/lib/validations';

describe('Todo Validations', () => {
  describe('createTodoSchema', () => {
    it('should validate valid todo creation data', () => {
      const validData = {
        title: 'Test Todo',
        due_date: '2024-12-31',
      };
      const result = createTodoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        due_date: '2024-12-31',
      };
      const result = createTodoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept null due_date', () => {
      const validData = {
        title: 'Test Todo',
        due_date: null,
      };
      const result = createTodoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateTodoSchema', () => {
    it('should validate valid todo update data', () => {
      const validData = {
        id: 1,
        title: 'Updated Todo',
        done_flag: true,
      };
      const result = updateTodoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require id', () => {
      const invalidData = {
        title: 'Updated Todo',
      };
      const result = updateTodoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deleteTodoSchema', () => {
    it('should validate todo deletion data', () => {
      const validData = { id: 1 };
      const result = deleteTodoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require id', () => {
      const invalidData = {};
      const result = deleteTodoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});