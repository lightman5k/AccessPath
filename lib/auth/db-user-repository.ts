import { ensureAuthDatabaseSchema, getAuthDatabase } from "./database";
import type { UserRepository } from "./user-repository";
import type { MockPlan, MockRole, StoredUser, StoredUserStatus } from "@/types";

type AuthUserRow = {
  id: string;
  email: string;
  email_normalized: string;
  full_name: string;
  company_name: string;
  password_hash: string;
  role: MockRole;
  plan: MockPlan;
  trial_ends_at: string | null;
  status: StoredUserStatus;
  created_at: string;
  updated_at: string;
};

function toStoredUser(row: AuthUserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    emailNormalized: row.email_normalized,
    fullName: row.full_name,
    companyName: row.company_name,
    passwordHash: row.password_hash,
    role: row.role,
    plan: row.plan,
    trialEndsAt: row.trial_ends_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export class DbUserRepository implements UserRepository {
  async findById(id: string) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      SELECT
        id,
        email,
        email_normalized,
        full_name,
        company_name,
        password_hash,
        role,
        plan,
        trial_ends_at,
        status,
        created_at,
        updated_at
      FROM auth_users
      WHERE id = ${id}
      LIMIT 1
    `) as AuthUserRow[];

    return row ? toStoredUser(row) : null;
  }

  async findByEmailNormalized(emailNormalized: string) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      SELECT
        id,
        email,
        email_normalized,
        full_name,
        company_name,
        password_hash,
        role,
        plan,
        trial_ends_at,
        status,
        created_at,
        updated_at
      FROM auth_users
      WHERE email_normalized = ${emailNormalized}
      LIMIT 1
    `) as AuthUserRow[];

    return row ? toStoredUser(row) : null;
  }

  async findAll() {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const rows = (await sql`
      SELECT
        id,
        email,
        email_normalized,
        full_name,
        company_name,
        password_hash,
        role,
        plan,
        trial_ends_at,
        status,
        created_at,
        updated_at
      FROM auth_users
      ORDER BY created_at ASC
    `) as AuthUserRow[];

    return rows.map(toStoredUser);
  }

  async create(user: StoredUser) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();

    try {
      const [row] = (await sql`
        INSERT INTO auth_users (
          id,
          email,
          email_normalized,
          full_name,
          company_name,
          password_hash,
          role,
          plan,
          trial_ends_at,
          status,
          created_at,
          updated_at
        )
        VALUES (
          ${user.id},
          ${user.email},
          ${user.emailNormalized},
          ${user.fullName},
          ${user.companyName},
          ${user.passwordHash},
          ${user.role},
          ${user.plan},
          ${user.trialEndsAt},
          ${user.status},
          ${user.createdAt},
          ${user.updatedAt}
        )
        RETURNING
          id,
          email,
          email_normalized,
          full_name,
          company_name,
          password_hash,
          role,
          plan,
          trial_ends_at,
          status,
          created_at,
          updated_at
      `) as AuthUserRow[];

      return row ? toStoredUser(row) : user;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error("AUTH_USER_CONFLICT");
      }

      throw error;
    }
  }

  async deleteById(id: string) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    await sql`DELETE FROM auth_users WHERE id = ${id}`;
  }

  async updateProfile(
    id: string,
    profile: Pick<StoredUser, "fullName" | "email" | "emailNormalized" | "companyName">,
  ) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();

    try {
      const [row] = (await sql`
        UPDATE auth_users
        SET
          full_name = ${profile.fullName},
          email = ${profile.email},
          email_normalized = ${profile.emailNormalized},
          company_name = ${profile.companyName},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${id}
        RETURNING
          id,
          email,
          email_normalized,
          full_name,
          company_name,
          password_hash,
          role,
          plan,
          trial_ends_at,
          status,
          created_at,
          updated_at
      `) as AuthUserRow[];

      if (!row) {
        throw new Error("USER_NOT_FOUND");
      }

      return toStoredUser(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error("AUTH_USER_CONFLICT");
      }

      throw error;
    }
  }

  async updatePlan(id: string, plan: MockPlan) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      UPDATE auth_users
      SET
        plan = ${plan},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING
        id,
        email,
        email_normalized,
        full_name,
        company_name,
        password_hash,
        role,
        plan,
        trial_ends_at,
        status,
        created_at,
        updated_at
    `) as AuthUserRow[];

    if (!row) {
      throw new Error("USER_NOT_FOUND");
    }

    return toStoredUser(row);
  }

  async updateRole(id: string, role: MockRole) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      UPDATE auth_users
      SET
        role = ${role},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING
        id,
        email,
        email_normalized,
        full_name,
        company_name,
        password_hash,
        role,
        plan,
        trial_ends_at,
        status,
        created_at,
        updated_at
    `) as AuthUserRow[];

    if (!row) {
      throw new Error("USER_NOT_FOUND");
    }

    return toStoredUser(row);
  }
}
