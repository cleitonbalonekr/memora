import { UserRepository, UserProfile, CreateUserProfileInput } from "@/ports/user-repository";
import { db } from "./index";
import { profiles } from "./schema";
import { eq } from "drizzle-orm";

export class DrizzleUserRepository implements UserRepository {
  async createProfile(input: CreateUserProfileInput): Promise<UserProfile> {
    const [row] = await db
      .insert(profiles)
      .values({
        id: input.id,
        email: input.email,
      })
      .returning();

    return {
      id: row.id,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findProfileById(id: string): Promise<UserProfile | null> {
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findProfileByEmail(email: string): Promise<UserProfile | null> {
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
