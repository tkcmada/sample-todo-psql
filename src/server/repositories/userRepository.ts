import { desc } from 'drizzle-orm';
import {
  users,
  type User,
  type UserApp,
  type UserRole,
  type UserWithAppsAndRoles,
} from '@/server/db/schema';
import type * as schema from '@/server/db/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;
async function getDb(): Promise<PostgresJsDatabase<typeof schema>> {
  if (!dbInstance) {
    dbInstance = (await import('@/server/db')).db;
  }
  return dbInstance;
}

export interface UserRepository {
  getAll(): Promise<UserWithAppsAndRoles[]>;
  getById(id: number): Promise<UserWithAppsAndRoles | null>;
}

class PgUserRepository implements UserRepository {
  async getAll(): Promise<UserWithAppsAndRoles[]> {
    const db = await getDb();
    return await db.query.users.findMany({
      with: {
        apps: true,
        roles: true,
      },
      orderBy: desc(users.created_at),
    });
  }

  async getById(id: number): Promise<UserWithAppsAndRoles | null> {
    const db = await getDb();
    const result = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
      with: {
        apps: true,
        roles: true,
      },
    });
    return result || null;
  }
}

class MemoryUserRepository implements UserRepository {
  private users: User[] = [
    {
      id: 1,
      name: 'john_doe',
      email: 'john@example.com',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    },
    {
      id: 2,
      name: 'jane_smith',
      email: 'jane@example.com',
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02'),
    },
    {
      id: 3,
      name: 'bob_wilson',
      email: 'bob@example.com',
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03'),
    },
    {
      id: 4,
      name: 'alice_brown',
      email: 'alice@example.com',
      created_at: new Date('2024-01-04'),
      updated_at: new Date('2024-01-04'),
    },
    {
      id: 5,
      name: 'charlie_davis',
      email: 'charlie@example.com',
      created_at: new Date('2024-01-05'),
      updated_at: new Date('2024-01-05'),
    },
  ];

  private userApps: UserApp[] = [
    { id: 1, user_id: 1, app_name: 'app1', created_at: new Date() },
    { id: 2, user_id: 1, app_name: 'app2', created_at: new Date() },
    { id: 3, user_id: 1, app_name: 'app3', created_at: new Date() },
    { id: 4, user_id: 2, app_name: 'app2', created_at: new Date() },
    { id: 5, user_id: 2, app_name: 'app4', created_at: new Date() },
    { id: 6, user_id: 3, app_name: 'app1', created_at: new Date() },
    { id: 7, user_id: 3, app_name: 'app3', created_at: new Date() },
    { id: 8, user_id: 3, app_name: 'app5', created_at: new Date() },
    { id: 9, user_id: 4, app_name: 'app1', created_at: new Date() },
    { id: 10, user_id: 4, app_name: 'app2', created_at: new Date() },
    { id: 11, user_id: 4, app_name: 'app4', created_at: new Date() },
    { id: 12, user_id: 4, app_name: 'app5', created_at: new Date() },
    { id: 13, user_id: 5, app_name: 'app3', created_at: new Date() },
  ];

  private userRoles: UserRole[] = [
    { id: 1, user_id: 1, role: 'admin', created_at: new Date() },
    { id: 2, user_id: 1, role: 'user', created_at: new Date() },
    { id: 3, user_id: 2, role: 'user', created_at: new Date() },
    { id: 4, user_id: 2, role: 'moderator', created_at: new Date() },
    { id: 5, user_id: 3, role: 'user', created_at: new Date() },
    { id: 6, user_id: 4, role: 'admin', created_at: new Date() },
    { id: 7, user_id: 4, role: 'super_admin', created_at: new Date() },
    { id: 8, user_id: 5, role: 'user', created_at: new Date() },
    { id: 9, user_id: 5, role: 'guest', created_at: new Date() },
  ];

  async getAll(): Promise<UserWithAppsAndRoles[]> {
    return this.users.map(user => ({
      ...user,
      apps: this.userApps.filter(app => app.user_id === user.id),
      roles: this.userRoles.filter(role => role.user_id === user.id),
    }));
  }

  async getById(id: number): Promise<UserWithAppsAndRoles | null> {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;

    return {
      ...user,
      apps: this.userApps.filter(app => app.user_id === user.id),
      roles: this.userRoles.filter(role => role.user_id === user.id),
    };
  }
}

let repository: UserRepository | null = null;
export function getUserRepository(): UserRepository {
  if (!repository) {
    repository = process.env.USE_LOCAL_DB === 'true'
      ? new MemoryUserRepository()
      : new PgUserRepository();
  }
  return repository;
}

export const userRepository = getUserRepository();