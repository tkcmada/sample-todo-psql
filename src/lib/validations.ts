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
  user_id: z.string().min(1, 'User ID is required').max(256, 'User ID is too long'),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z.string().email('Invalid email format').max(255, 'Email is too long'),
  apps: z.array(z.string()).default([]),
  appRoles: z.array(z.object({
    app_name: z.string(),
    role: z.string(),
  })).default([]),
});

export const updateUserSchema = z.object({
  user_id: z.string().min(1).max(256),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  apps: z.array(z.string()).optional(),
  appRoles: z.array(z.object({
    app_name: z.string(),
    role: z.string(),
  })).optional(),
});

export const deleteUserSchema = z.object({
  user_id: z.string(),
});

// Team Structure Page validation schemas

// Node schema for chart_data
const nodeSchema = z.object({
  id: z.string(),
  type: z.string().default('person'),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    user_id: z.string(),
  }),
  draggable: z.boolean().optional(),
});

// Edge schema for chart_data
const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.enum(['default', 'straight', 'step', 'smoothstep', 'bezier']).default('smoothstep'),
  animated: z.boolean().default(false),
  style: z.object({
    stroke: z.string().default('#64748b'),
    strokeWidth: z.number().positive().default(2),
  }).optional(),
  markerEnd: z.object({
    type: z.enum(['arrow', 'arrowclosed']).default('arrowclosed'),
    color: z.string().default('#64748b'),
  }).optional(),
});

// Chart data schema
const chartDataSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

// Team structure page schemas
export const createTeamStructurePageSchema = z.object({
  page_name: z.string().min(1, 'Page name is required').max(100),
  description: z.string().max(500).optional(),
  chart_data: chartDataSchema,
});

export const updateTeamStructurePageSchema = z.object({
  id: z.number(),
  page_name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  chart_data: chartDataSchema.optional(),
});

export const deleteTeamStructurePageSchema = z.object({
  id: z.number(),
});