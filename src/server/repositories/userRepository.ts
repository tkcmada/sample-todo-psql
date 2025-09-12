import { desc, eq } from 'drizzle-orm';
import {
  users,
  userApps,
  userRoles,
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

class MemoryUserRepository implements UserRepository {
  private users: User[] = [
    { user_id: 'user_1', name: 'john_doe', email: 'john@example.com', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { user_id: 'user_2', name: 'jane_smith', email: 'jane@example.com', created_at: new Date('2024-01-02'), updated_at: new Date('2024-01-02') },
    { user_id: 'user_3', name: 'bob_wilson', email: 'bob@example.com', created_at: new Date('2024-01-03'), updated_at: new Date('2024-01-03') },
  ];

  private userApps: UserApp[] = [
    { id: 1, user_id: 'user_1', app_name: 'usermanager', created_at: new Date() },
    { id: 2, user_id: 'user_1', app_name: 'quoteapp', created_at: new Date() },
    { id: 3, user_id: 'user_2', app_name: 'quoteapp', created_at: new Date() },
    { id: 4, user_id: 'user_3', app_name: 'usermanager', created_at: new Date() },
  ];

  private userRoles: UserRole[] = [
    { id: 1, user_id: 'user_1', app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 2, user_id: 'user_1', app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 3, user_id: 'user_2', app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 4, user_id: 'user_3', app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
  ];

  private nextUserId = 4;
  private nextUserAppId = 40;
  private nextUserRoleId = 40;

  async getAll(): Promise<UserWithAppsAndRoles[]> {
    return this.users.map(user => ({
      user_id: user.user_id,
      username: user.name,
      email: user.email,
      apps: this.userApps.filter(app => app.user_id === user.user_id).map(app => app.app_name),
      roles: this.userRoles.filter(role => role.user_id === user.user_id).map(role => `${role.app_name}-${role.role}`),
    }));
  }

  async getById(user_id: string): Promise<UserWithAppsAndRoles | null> {
    const user = this.users.find(u => u.user_id === user_id);
    if (!user) return null;

    return {
      user_id: user.user_id,
      username: user.name,
      email: user.email,
      apps: this.userApps.filter(app => app.user_id === user.user_id).map(app => app.app_name),
      roles: this.userRoles.filter(role => role.user_id === user.user_id).map(role => `${role.app_name}-${role.role}`),
    };
  }

  async create(input: { user_id: string; name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }): Promise<User> {
    const newUser: User = {
      user_id: input.user_id,
      name: input.name,
      email: input.email,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.push(newUser);

    // Add user apps
    input.apps.forEach(appName => {
      this.userApps.push({
        id: this.nextUserAppId++,
        user_id: newUser.user_id,
        app_name: appName,
        created_at: new Date(),
      });
    });

    // Add user app-roles
    input.appRoles.forEach(appRole => {
      this.userRoles.push({
        id: this.nextUserRoleId++,
        user_id: newUser.user_id,
        app_name: appRole.app_name,
        role: appRole.role,
        created_at: new Date(),
      });
    });

    return newUser;
  }

  async update(input: { id: number; name?: string; email?: string; apps?: string[]; appRoles?: { app_name: string; role: string }[] }): Promise<User> {
    const user = this.users.find(u => u.id === input.id);
    if (!user) throw new Error('User not found');

    // Update user basic info
    if (input.name) user.name = input.name;
    if (input.email) user.email = input.email;
    user.updated_at = new Date();

    // Update apps if provided
    if (input.apps !== undefined) {
      this.userApps = this.userApps.filter(app => app.user_id !== input.id);
      input.apps.forEach(appName => {
        this.userApps.push({
          id: this.nextUserAppId++,
          user_id: input.id,
          app_name: appName,
          created_at: new Date(),
        });
      });
    }

    // Update app-roles if provided
    if (input.appRoles !== undefined) {
      this.userRoles = this.userRoles.filter(role => role.user_id !== input.id);
      input.appRoles.forEach(appRole => {
        this.userRoles.push({
          id: this.nextUserRoleId++,
          user_id: input.id,
          app_name: appRole.app_name,
          role: appRole.role,
          created_at: new Date(),
        });
      });
    }

    return user;
  }

  async delete(id: number): Promise<{ success: true }> {
    this.users = this.users.filter(u => u.id !== id);
    this.userApps = this.userApps.filter(app => app.user_id !== id);
    this.userRoles = this.userRoles.filter(role => role.user_id !== id);
    return { success: true };
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