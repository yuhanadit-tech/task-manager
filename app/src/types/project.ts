// Types for Project entity
export type ProjectRole = "owner" | "admin" | "member";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}
