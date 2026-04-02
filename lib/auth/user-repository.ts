import type { MockPlan, MockRole, StoredUser } from "@/types";

export interface UserRepository {
  findById(id: string): Promise<StoredUser | null>;
  findByEmailNormalized(emailNormalized: string): Promise<StoredUser | null>;
  findAll(): Promise<StoredUser[]>;
  create(user: StoredUser): Promise<StoredUser>;
  deleteById(id: string): Promise<void>;
  updateProfile(
    id: string,
    profile: Pick<StoredUser, "fullName" | "email" | "emailNormalized" | "companyName">,
  ): Promise<StoredUser>;
  updatePlan(id: string, plan: MockPlan): Promise<StoredUser>;
  updateRole(id: string, role: MockRole): Promise<StoredUser>;
}
