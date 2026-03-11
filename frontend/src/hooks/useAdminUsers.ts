import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type AdminUserSummary, type CreateAdminUserRequest } from '../services/admin.service';
import toast from 'react-hot-toast';

export const useAdminUsers = () => {
  return useQuery<AdminUserSummary[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers(),
  });
};

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminUserRequest) => adminService.createUser(payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`User "${user.email}" created`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });
};

