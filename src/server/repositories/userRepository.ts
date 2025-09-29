import { desc, eq } from 'drizzle-orm';
import { user, user_app, user_role } from '@/server/db/schema';
import type { User } from '@/lib/types-generated';
import type { UserWithAppsAndRoles } from '@/lib/types-composite';
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
    const userFromDb = await db.query.user.findMany({
      with: {
        user_app: true,
        user_role: true,
      },
      orderBy: desc(user.created_at),
    });

    // Convert database results to API types
    return userFromDb.map(user => ({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      position: user.position,
      photo_url: user.photo_url,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      apps: user.user_app.map(app => ({
        id: app.id,
        user_id: app.user_id,
        app_name: app.app_name,
        created_at: app.created_at.toISOString(),
      })),
      roles: user.user_role.map(role => ({
        id: role.id,
        user_id: role.user_id,
        app_name: role.app_name,
        role: role.role,
        created_at: role.created_at.toISOString(),
      })),
    }));
  }

  async getById(user_id: string): Promise<UserWithAppsAndRoles | null> {
    const db = await getDb();
    const result = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.user_id, user_id),
      with: {
        user_app: true,
        user_role: true,
      },
    });

    if (!result) return null;

    // Convert database result to API type
    return {
      user_id: result.user_id,
      name: result.name,
      email: result.email,
      position: result.position,
      photo_url: result.photo_url,
      created_at: result.created_at.toISOString(),
      updated_at: result.updated_at.toISOString(),
      apps: result.user_app.map(app => ({
        id: app.id,
        user_id: app.user_id,
        app_name: app.app_name,
        created_at: app.created_at.toISOString(),
      })),
      roles: result.user_role.map(role => ({
        id: role.id,
        user_id: role.user_id,
        app_name: role.app_name,
        role: role.role,
        created_at: role.created_at.toISOString(),
      })),
    };
  }

  async create(input: { user_id: string; name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }): Promise<User> {
    const db = await getDb();

    const [newUser] = await db
      .insert(user)
      .values({ user_id: input.user_id, name: input.name, email: input.email })
      .returning();

    // Insert user apps
    if (input.apps.length > 0) {
      await db.insert(user_app).values(
        input.apps.map(appName => ({
          user_id: newUser.user_id,
          app_name: appName,
        }))
      );
    }

    // Insert user app-roles
    if (input.appRoles.length > 0) {
      await db.insert(user_role).values(
        input.appRoles.map(appRole => ({
          user_id: newUser.user_id,
          app_name: appRole.app_name,
          role: appRole.role,
        }))
      );
    }

    // Convert to API type
    return {
      user_id: newUser.user_id,
      name: newUser.name,
      email: newUser.email,
      position: newUser.position,
      photo_url: newUser.photo_url,
      created_at: newUser.created_at.toISOString(),
      updated_at: newUser.updated_at.toISOString(),
    };
  }

  async update(input: { user_id: string; name?: string; email?: string; apps?: string[]; appRoles?: { app_name: string; role: string }[] }): Promise<User> {
    const db = await getDb();
    const { user_id, apps, appRoles, ...userData } = input;

    // Update user basic info
    const [updatedUser] = await db
      .update(user)
      .set({ ...userData, updated_at: new Date() })
      .where(eq(user.user_id, user_id))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }

    // Update apps if provided
    if (apps !== undefined) {
      await db.delete(user_app).where(eq(user_app.user_id, user_id));
      if (apps.length > 0) {
        await db.insert(user_app).values(
          apps.map(appName => ({
            user_id: user_id,
            app_name: appName,
          }))
        );
      }
    }

    // Update app-roles if provided
    if (appRoles !== undefined) {
      await db.delete(user_role).where(eq(user_role.user_id, user_id));
      if (appRoles.length > 0) {
        await db.insert(user_role).values(
          appRoles.map(appRole => ({
            user_id: user_id,
            app_name: appRole.app_name,
            role: appRole.role,
          }))
        );
      }
    }

    // Convert to API type
    return {
      user_id: updatedUser.user_id,
      name: updatedUser.name,
      email: updatedUser.email,
      position: updatedUser.position,
      photo_url: updatedUser.photo_url,
      created_at: updatedUser.created_at.toISOString(),
      updated_at: updatedUser.updated_at.toISOString(),
    };
  }

  async delete(user_id: string): Promise<{ success: true }> {
    const db = await getDb();

    // Delete related records first
    await db.delete(user_app).where(eq(user_app.user_id, user_id));
    await db.delete(user_role).where(eq(user_role.user_id, user_id));

    // Delete user
    await db.delete(user).where(eq(user.user_id, user_id));

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
