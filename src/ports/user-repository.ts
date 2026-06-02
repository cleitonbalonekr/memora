export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProfileInput {
  id: string;
  email: string;
}

export interface UserRepository {
  createProfile(input: CreateUserProfileInput): Promise<UserProfile>;
  findProfileById(id: string): Promise<UserProfile | null>;
  findProfileByEmail(email: string): Promise<UserProfile | null>;
}
