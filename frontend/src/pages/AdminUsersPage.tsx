import React from 'react';
import { Shield, Mail, UserPlus, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAdminUsers, useCreateAdminUser } from '../hooks/useAdminUsers';
import type { UserRole } from '../types';

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const { data: users, isLoading, isError, error } = useAdminUsers();
  const createMutation = useCreateAdminUser();

  const [form, setForm] = React.useState<{
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    temporaryPassword: string;
  }>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer',
    temporaryPassword: '',
  });

  const isAdmin = user?.role === 'admin' && user.email === 'admin@ubalt.edu';

  if (!isAdmin) {
    return (
      <div className="max-w-xl rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-red-600 dark:text-red-300" />
          <h1 className="text-lg font-semibold text-red-800 dark:text-red-100">
            Access restricted
          </h1>
        </div>
        <p className="text-sm text-red-700 dark:text-red-200">
          Only the UBalt EIS administrator (`admin@ubalt.edu`) can manage user accounts.
        </p>
      </div>
    );
  }

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" />
          Admin – User Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Provision additional Cognito users by email and assign UBalt EIS roles.
        </p>
      </div>

      {/* Create user form */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create user
          </h2>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-gray-700 dark:text-gray-200 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              Email
            </span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-gray-900 dark:text-gray-50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-700 dark:text-gray-200">First name</span>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-gray-900 dark:text-gray-50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-700 dark:text-gray-200">Last name</span>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-gray-900 dark:text-gray-50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-700 dark:text-gray-200">Role</span>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value as UserRole)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-gray-900 dark:text-gray-50"
            >
              <option value="viewer">Viewer</option>
              <option value="president">President</option>
              <option value="provost">Provost</option>
              <option value="cfo">CFO</option>
              <option value="dean">Dean</option>
              <option value="department_chair">Department Chair</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-gray-700 dark:text-gray-200 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Temporary password
            </span>
            <input
              type="password"
              required
              value={form.temporaryPassword}
              onChange={(e) => handleChange('temporaryPassword', e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-gray-900 dark:text-gray-50"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This password will be set as a permanent password in Cognito; share it securely with the user.
            </span>
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>
      </section>

      {/* Existing users */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Existing users (Cognito)
          </h2>
        </div>

        {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading users…</p>}
        {isError && (
          <p className="text-sm text-red-600 dark:text-red-300">
            Failed to load users: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        )}

        {!isLoading && users && users.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No users found in Cognito.</p>
        )}

        {!isLoading && users && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Role
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.username}>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-50">{u.email}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                      {(u.firstName || u.lastName) ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200 capitalize">
                      {u.role ?? 'viewer'}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                      {u.status ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminUsersPage;

