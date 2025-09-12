import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  due_date: z.string().optional().nullable(),
});

export const updateTodoSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional(),
  due_date: z.string().optional().nullable(),
  done_flag: z.boolean().optional(),
});

export const deleteTodoSchema = z.object({
  id: z.number(),
});

export const toggleTodoSchema = z.object({
  id: z.number(),
});

// User validation schemas
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z.string().email('Invalid email format').max(255, 'Email is too long'),
  apps: z.array(z.string()).optional().default([]),
  appRoles: z.array(z.object({
    app_name: z.string(),
    role: z.string(),
  })).optional().default([]),
});

export const updateUserSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  apps: z.array(z.string()).optional(),
  appRoles: z.array(z.object({
    app_name: z.string(),
    role: z.string(),
  })).optional(),
});

export const deleteUserSchema = z.object({
  id: z.number(),
});