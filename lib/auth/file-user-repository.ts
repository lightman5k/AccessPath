import { authConfig } from "./config";
import { mutateJsonFile, readJsonFile } from "./file-store";
import type { UserRepository } from "./user-repository";
import type { MockPlan, MockRole, StoredUser } from "@/types";

const defaultUsers: StoredUser[] = [];

/**
 * Local/demo-only user repository backed by JSON files.
 * This is intentionally simple and only safe for a single running instance.
 */
export class FileUserRepository implements UserRepository {
  constructor(private readonly filePath = authConfig.usersFilePath) {}

  async findById(id: string) {
    const users = await readJsonFile(this.filePath, defaultUsers);
    return users.find((user) => user.id === id) ?? null;
  }

  async findByEmailNormalized(emailNormalized: string) {
    const users = await readJsonFile(this.filePath, defaultUsers);
    return users.find((user) => user.emailNormalized === emailNormalized) ?? null;
  }

  async findAll() {
    return await readJsonFile(this.filePath, defaultUsers);
  }

  async create(user: StoredUser) {
    const users = await mutateJsonFile(this.filePath, defaultUsers, (currentUsers) => {
      if (currentUsers.some((currentUser) => currentUser.emailNormalized === user.emailNormalized)) {
        throw new Error("AUTH_USER_CONFLICT");
      }

      return [...currentUsers, user];
    });

    return users.find((storedUser) => storedUser.id === user.id) ?? user;
  }

  async deleteById(id: string) {
    await mutateJsonFile(this.filePath, defaultUsers, (currentUsers) => {
      return currentUsers.filter((user) => user.id !== id);
    });
  }

  async updateProfile(
    id: string,
    profile: Pick<StoredUser, "fullName" | "email" | "emailNormalized" | "companyName">,
  ): Promise<StoredUser> {
    let updatedUser: StoredUser | null = null;

    await mutateJsonFile(this.filePath, defaultUsers, (currentUsers) => {
      if (
        currentUsers.some(
          (user) => user.id !== id && user.emailNormalized === profile.emailNormalized,
        )
      ) {
        throw new Error("AUTH_USER_CONFLICT");
      }

      return currentUsers.map((user) => {
        if (user.id !== id) return user;

        const nextUser: StoredUser = {
          ...user,
          fullName: profile.fullName,
          email: profile.email,
          emailNormalized: profile.emailNormalized,
          companyName: profile.companyName,
          updatedAt: new Date().toISOString(),
        };
        updatedUser = nextUser;
        return nextUser;
      });
    });

    if (!updatedUser) {
      throw new Error("USER_NOT_FOUND");
    }

    return updatedUser;
  }

  async updatePlan(id: string, plan: MockPlan) {
    let updatedUser: StoredUser | null = null;

    await mutateJsonFile(this.filePath, defaultUsers, (currentUsers) => {
      return currentUsers.map((user) => {
        if (user.id !== id) return user;
        const nextUser: StoredUser = { ...user, plan };
        updatedUser = nextUser;
        return nextUser;
      });
    });

    if (!updatedUser) {
      throw new Error("USER_NOT_FOUND");
    }

    return updatedUser;
  }

  async updateRole(id: string, role: MockRole) {
    let updatedUser: StoredUser | null = null;

    await mutateJsonFile(this.filePath, defaultUsers, (currentUsers) => {
      return currentUsers.map((user) => {
        if (user.id !== id) return user;
        const nextUser: StoredUser = { ...user, role };
        updatedUser = nextUser;
        return nextUser;
      });
    });

    if (!updatedUser) {
      throw new Error("USER_NOT_FOUND");
    }

    return updatedUser;
  }
}
