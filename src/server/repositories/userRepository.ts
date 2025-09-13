import { desc, eq } from 'drizzle-orm';
import {
  users,
  userApps,
  userRoles,
  type User,
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
  getById(user_id: string): Promise<UserWithAppsAndRoles | null>;
  create(input: { user_id: string; name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }): Promise<User>;
  update(input: { user_id: string; name?: string; email?: string; apps?: string[]; appRoles?: { app_name: string; role: string }[] }): Promise<User>;
  delete(user_id: string): Promise<{ success: true }>;
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

  async getById(user_id: string): Promise<UserWithAppsAndRoles | null> {
    const db = await getDb();
    const result = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.user_id, user_id),
      with: {
        apps: true,
        roles: true,
      },
    });
    return result || null;
  }

  async create(input: { user_id: string; name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }): Promise<User> {
    const db = await getDb();
    
    const [newUser] = await db
      .insert(users)
      .values({ user_id: input.user_id, name: input.name, email: input.email })
      .returning();

    // Insert user apps
    if (input.apps.length > 0) {
      await db.insert(userApps).values(
        input.apps.map(appName => ({
          user_id: newUser.user_id,
          app_name: appName,
        }))
      );
    }

    // Insert user app-roles
    if (input.appRoles.length > 0) {
      await db.insert(userRoles).values(
        input.appRoles.map(appRole => ({
          user_id: newUser.user_id,
          app_name: appRole.app_name,
          role: appRole.role,
        }))
      );
    }

    return newUser;
  }

  async update(input: { user_id: string; name?: string; email?: string; apps?: string[]; appRoles?: { app_name: string; role: string }[] }): Promise<User> {
    const db = await getDb();
    const { user_id, apps, appRoles, ...userData } = input;

    // Update user basic info
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updated_at: new Date() })
      .where(eq(users.user_id, user_id))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }

    // Update apps if provided
    if (apps !== undefined) {
      await db.delete(userApps).where(eq(userApps.user_id, user_id));
      if (apps.length > 0) {
        await db.insert(userApps).values(
          apps.map(appName => ({
            user_id: user_id,
            app_name: appName,
          }))
        );
      }
    }

    // Update app-roles if provided
    if (appRoles !== undefined) {
      await db.delete(userRoles).where(eq(userRoles.user_id, user_id));
      if (appRoles.length > 0) {
        await db.insert(userRoles).values(
          appRoles.map(appRole => ({
            user_id: user_id,
            app_name: appRole.app_name,
            role: appRole.role,
          }))
        );
      }
    }

    return updatedUser;
  }

  async delete(user_id: string): Promise<{ success: true }> {
    const db = await getDb();
    
    // Delete related records first
    await db.delete(userApps).where(eq(userApps.user_id, user_id));
    await db.delete(userRoles).where(eq(userRoles.user_id, user_id));
    
    // Delete user
    await db.delete(users).where(eq(users.user_id, user_id));
    
    return { success: true };
  }
}

let repository: UserRepository | null = null;
export function getUserRepository(): UserRepository {
  if (!repository) {
    repository = new PgUserRepository();
  }
  return repository;
}

export const userRepository = getUserRepository();
