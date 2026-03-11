import { apiService } from './api.service';
import type { UserRole } from '../types';

export interface AdminUserSummary {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: string;
  createdAt?: string;
}

export interface CreateAdminUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  temporaryPassword: string;
}

class AdminService {
  async listUsers(): Promise<AdminUserSummary[]> {
    return apiService.get<AdminUserSummary[]>('/admin/users');
  }

  async createUser(payload: CreateAdminUserRequest): Promise<AdminUserSummary> {
    return apiService.post<AdminUserSummary>('/admin/users', payload);
  }
}

export const adminService = new AdminService();

