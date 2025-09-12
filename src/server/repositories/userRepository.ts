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
  getById(id: number): Promise<UserWithAppsAndRoles | null>;
  create(input: { name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }): Promise<User>;
  update(input: { id: number; name?: string; email?: string; apps?: string[]; appRoles?: { app_name: string; role: string }[] }): Promise<User>;
  delete(id: number): Promise<{ success: true }>;
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

  async create(input: { name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }): Promise<User> {
    const db = await getDb();
    
    const [newUser] = await db
      .insert(users)
      .values({ name: input.name, email: input.email })
      .returning();

    // Insert user apps
    if (input.apps.length > 0) {
      await db.insert(userApps).values(
        input.apps.map(appName => ({
          user_id: newUser.id,
          app_name: appName,
        }))
      );
    }

    // Insert user app-roles
    if (input.appRoles.length > 0) {
      await db.insert(userRoles).values(
        input.appRoles.map(appRole => ({
          user_id: newUser.id,
          app_name: appRole.app_name,
          role: appRole.role,
        }))
      );
    }

    return newUser;
  }

  async update(input: { id: number; name?: string; email?: string; apps?: string[]; appRoles?: { app_name: string; role: string }[] }): Promise<User> {
    const db = await getDb();
    const { id, apps, appRoles, ...userData } = input;

    // Update user basic info
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }

    // Update apps if provided
    if (apps !== undefined) {
      await db.delete(userApps).where(eq(userApps.user_id, id));
      if (apps.length > 0) {
        await db.insert(userApps).values(
          apps.map(appName => ({
            user_id: id,
            app_name: appName,
          }))
        );
      }
    }

    // Update app-roles if provided
    if (appRoles !== undefined) {
      await db.delete(userRoles).where(eq(userRoles.user_id, id));
      if (appRoles.length > 0) {
        await db.insert(userRoles).values(
          appRoles.map(appRole => ({
            user_id: id,
            app_name: appRole.app_name,
            role: appRole.role,
          }))
        );
      }
    }

    return updatedUser;
  }

  async delete(id: number): Promise<{ success: true }> {
    const db = await getDb();
    
    // Delete related records first
    await db.delete(userApps).where(eq(userApps.user_id, id));
    await db.delete(userRoles).where(eq(userRoles.user_id, id));
    
    // Delete user
    await db.delete(users).where(eq(users.id, id));
    
    return { success: true };
  }
}

class MemoryUserRepository implements UserRepository {
  private users: User[] = [
    { id: 1, name: 'john_doe', email: 'john@example.com', created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 2, name: 'jane_smith', email: 'jane@example.com', created_at: new Date('2024-01-02'), updated_at: new Date('2024-01-02') },
    { id: 3, name: 'bob_wilson', email: 'bob@example.com', created_at: new Date('2024-01-03'), updated_at: new Date('2024-01-03') },
    { id: 4, name: 'alice_brown', email: 'alice@example.com', created_at: new Date('2024-01-04'), updated_at: new Date('2024-01-04') },
    { id: 5, name: 'charlie_davis', email: 'charlie@example.com', created_at: new Date('2024-01-05'), updated_at: new Date('2024-01-05') },
    { id: 6, name: 'emma_johnson', email: 'emma@example.com', created_at: new Date('2024-01-06'), updated_at: new Date('2024-01-06') },
    { id: 7, name: 'david_miller', email: 'david@example.com', created_at: new Date('2024-01-07'), updated_at: new Date('2024-01-07') },
    { id: 8, name: 'sarah_garcia', email: 'sarah@example.com', created_at: new Date('2024-01-08'), updated_at: new Date('2024-01-08') },
    { id: 9, name: 'michael_rodriguez', email: 'michael@example.com', created_at: new Date('2024-01-09'), updated_at: new Date('2024-01-09') },
    { id: 10, name: 'lisa_martinez', email: 'lisa@example.com', created_at: new Date('2024-01-10'), updated_at: new Date('2024-01-10') },
    { id: 11, name: 'kevin_anderson', email: 'kevin@example.com', created_at: new Date('2024-01-11'), updated_at: new Date('2024-01-11') },
    { id: 12, name: 'maria_taylor', email: 'maria@example.com', created_at: new Date('2024-01-12'), updated_at: new Date('2024-01-12') },
    { id: 13, name: 'james_thomas', email: 'james@example.com', created_at: new Date('2024-01-13'), updated_at: new Date('2024-01-13') },
    { id: 14, name: 'jennifer_jackson', email: 'jennifer@example.com', created_at: new Date('2024-01-14'), updated_at: new Date('2024-01-14') },
    { id: 15, name: 'robert_white', email: 'robert@example.com', created_at: new Date('2024-01-15'), updated_at: new Date('2024-01-15') },
    { id: 16, name: 'linda_harris', email: 'linda@example.com', created_at: new Date('2024-01-16'), updated_at: new Date('2024-01-16') },
    { id: 17, name: 'william_clark', email: 'william@example.com', created_at: new Date('2024-01-17'), updated_at: new Date('2024-01-17') },
    { id: 18, name: 'patricia_lewis', email: 'patricia@example.com', created_at: new Date('2024-01-18'), updated_at: new Date('2024-01-18') },
    { id: 19, name: 'daniel_walker', email: 'daniel@example.com', created_at: new Date('2024-01-19'), updated_at: new Date('2024-01-19') },
    { id: 20, name: 'nancy_hall', email: 'nancy@example.com', created_at: new Date('2024-01-20'), updated_at: new Date('2024-01-20') },
    { id: 21, name: 'mark_allen', email: 'mark@example.com', created_at: new Date('2024-01-21'), updated_at: new Date('2024-01-21') },
    { id: 22, name: 'helen_young', email: 'helen@example.com', created_at: new Date('2024-01-22'), updated_at: new Date('2024-01-22') },
    { id: 23, name: 'paul_hernandez', email: 'paul@example.com', created_at: new Date('2024-01-23'), updated_at: new Date('2024-01-23') },
    { id: 24, name: 'susan_king', email: 'susan@example.com', created_at: new Date('2024-01-24'), updated_at: new Date('2024-01-24') },
    { id: 25, name: 'andrew_wright', email: 'andrew@example.com', created_at: new Date('2024-01-25'), updated_at: new Date('2024-01-25') },
    { id: 26, name: 'donna_lopez', email: 'donna@example.com', created_at: new Date('2024-01-26'), updated_at: new Date('2024-01-26') },
    { id: 27, name: 'steven_hill', email: 'steven@example.com', created_at: new Date('2024-01-27'), updated_at: new Date('2024-01-27') },
    { id: 28, name: 'ruth_scott', email: 'ruth@example.com', created_at: new Date('2024-01-28'), updated_at: new Date('2024-01-28') },
    { id: 29, name: 'anthony_green', email: 'anthony@example.com', created_at: new Date('2024-01-29'), updated_at: new Date('2024-01-29') },
    { id: 30, name: 'carol_adams', email: 'carol@example.com', created_at: new Date('2024-01-30'), updated_at: new Date('2024-01-30') },
  ];

  private userApps: UserApp[] = [
    // Users 1-10: Mixed access patterns
    { id: 1, user_id: 1, app_name: 'usermanager', created_at: new Date() },
    { id: 2, user_id: 1, app_name: 'quoteapp', created_at: new Date() },
    { id: 3, user_id: 2, app_name: 'quoteapp', created_at: new Date() },
    { id: 4, user_id: 3, app_name: 'usermanager', created_at: new Date() },
    { id: 5, user_id: 4, app_name: 'usermanager', created_at: new Date() },
    { id: 6, user_id: 4, app_name: 'quoteapp', created_at: new Date() },
    { id: 7, user_id: 5, app_name: 'quoteapp', created_at: new Date() },
    { id: 8, user_id: 6, app_name: 'usermanager', created_at: new Date() },
    { id: 9, user_id: 7, app_name: 'usermanager', created_at: new Date() },
    { id: 10, user_id: 7, app_name: 'quoteapp', created_at: new Date() },
    { id: 11, user_id: 8, app_name: 'quoteapp', created_at: new Date() },
    { id: 12, user_id: 9, app_name: 'usermanager', created_at: new Date() },
    { id: 13, user_id: 10, app_name: 'quoteapp', created_at: new Date() },
    // Users 11-20: More patterns
    { id: 14, user_id: 11, app_name: 'usermanager', created_at: new Date() },
    { id: 15, user_id: 11, app_name: 'quoteapp', created_at: new Date() },
    { id: 16, user_id: 12, app_name: 'usermanager', created_at: new Date() },
    { id: 17, user_id: 13, app_name: 'quoteapp', created_at: new Date() },
    { id: 18, user_id: 14, app_name: 'usermanager', created_at: new Date() },
    { id: 19, user_id: 15, app_name: 'quoteapp', created_at: new Date() },
    { id: 20, user_id: 16, app_name: 'usermanager', created_at: new Date() },
    { id: 21, user_id: 16, app_name: 'quoteapp', created_at: new Date() },
    { id: 22, user_id: 17, app_name: 'usermanager', created_at: new Date() },
    { id: 23, user_id: 18, app_name: 'quoteapp', created_at: new Date() },
    { id: 24, user_id: 19, app_name: 'usermanager', created_at: new Date() },
    { id: 25, user_id: 20, app_name: 'quoteapp', created_at: new Date() },
    // Users 21-30: Additional patterns
    { id: 26, user_id: 21, app_name: 'usermanager', created_at: new Date() },
    { id: 27, user_id: 21, app_name: 'quoteapp', created_at: new Date() },
    { id: 28, user_id: 22, app_name: 'usermanager', created_at: new Date() },
    { id: 29, user_id: 23, app_name: 'quoteapp', created_at: new Date() },
    { id: 30, user_id: 24, app_name: 'usermanager', created_at: new Date() },
    { id: 31, user_id: 24, app_name: 'quoteapp', created_at: new Date() },
    { id: 32, user_id: 25, app_name: 'usermanager', created_at: new Date() },
    { id: 33, user_id: 26, app_name: 'quoteapp', created_at: new Date() },
    { id: 34, user_id: 27, app_name: 'usermanager', created_at: new Date() },
    { id: 35, user_id: 27, app_name: 'quoteapp', created_at: new Date() },
    { id: 36, user_id: 28, app_name: 'quoteapp', created_at: new Date() },
    { id: 37, user_id: 29, app_name: 'usermanager', created_at: new Date() },
    { id: 38, user_id: 30, app_name: 'usermanager', created_at: new Date() },
    { id: 39, user_id: 30, app_name: 'quoteapp', created_at: new Date() },
  ];

  private userRoles: UserRole[] = [
    // Users 1-10: Mixed role patterns
    { id: 1, user_id: 1, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 2, user_id: 1, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 3, user_id: 2, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 4, user_id: 3, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 5, user_id: 4, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 6, user_id: 4, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 7, user_id: 5, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 8, user_id: 6, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 9, user_id: 7, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 10, user_id: 7, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 11, user_id: 8, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 12, user_id: 9, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 13, user_id: 10, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    // Users 11-20: Additional role assignments
    { id: 14, user_id: 11, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 15, user_id: 11, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 16, user_id: 12, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 17, user_id: 13, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 18, user_id: 14, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 19, user_id: 15, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 20, user_id: 16, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 21, user_id: 16, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 22, user_id: 17, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 23, user_id: 18, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 24, user_id: 19, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 25, user_id: 20, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    // Users 21-30: Final role assignments
    { id: 26, user_id: 21, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 27, user_id: 21, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 28, user_id: 22, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 29, user_id: 23, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 30, user_id: 24, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 31, user_id: 24, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 32, user_id: 25, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 33, user_id: 26, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 34, user_id: 27, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 35, user_id: 27, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
    { id: 36, user_id: 28, app_name: 'quoteapp', role: 'quoteapp-trader', created_at: new Date() },
    { id: 37, user_id: 29, app_name: 'usermanager', role: 'usermanager-approver', created_at: new Date() },
    { id: 38, user_id: 30, app_name: 'usermanager', role: 'usermanager-admin', created_at: new Date() },
    { id: 39, user_id: 30, app_name: 'quoteapp', role: 'quoteapp-sales', created_at: new Date() },
  ];

  private nextUserId = 31;
  private nextUserAppId = 40;
  private nextUserRoleId = 40;

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

  async create(input: { name: string; email: string; apps: string[]; appRoles: { app_name: string; role: string }[] }): Promise<User> {
    const newUser: User = {
      id: this.nextUserId++,
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
        user_id: newUser.id,
        app_name: appName,
        created_at: new Date(),
      });
    });

    // Add user app-roles
    input.appRoles.forEach(appRole => {
      this.userRoles.push({
        id: this.nextUserRoleId++,
        user_id: newUser.id,
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