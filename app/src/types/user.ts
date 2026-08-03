// Types for User entity
export interface User {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// API response wrapper — standard shape for all endpoints
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}
