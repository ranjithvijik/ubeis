import React from 'react';
import { Bell, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { safeGetItem, safeSetItem } from '../utils/storage';

type NotificationPrefs = {
  alertsCritical: boolean;
  alertsWarning: boolean;
  alertsInfo: boolean;
  emailDigest: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  alertsCritical: true,
  alertsWarning: true,
  alertsInfo: false,
  emailDigest: false,
};

const STORAGE_KEY = 'settings:notifications:v1';

const readPrefs = (): NotificationPrefs => {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      alertsCritical: parsed.alertsCritical ?? DEFAULT_PREFS.alertsCritical,
      alertsWarning: parsed.alertsWarning ?? DEFAULT_PREFS.alertsWarning,
      alertsInfo: parsed.alertsInfo ?? DEFAULT_PREFS.alertsInfo,
      emailDigest: parsed.emailDigest ?? DEFAULT_PREFS.emailDigest,
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

const writePrefs = (prefs: NotificationPrefs) => {
  safeSetItem(STORAGE_KEY, JSON.stringify(prefs));
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(() => readPrefs());

  React.useEffect(() => {
    writePrefs(prefs);
  }, [prefs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your profile, appearance, and notifications.
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile
          </h2>
        </div>

        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Name</div>
              <div className="text-gray-900 dark:text-white font-medium">
                {user.firstName} {user.lastName}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Email</div>
              <div className="text-gray-900 dark:text-white font-medium">
                {user.email}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Role</div>
              <div className="text-gray-900 dark:text-white font-medium capitalize">
                {user.role.replace('_', ' ')}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Department</div>
              <div className="text-gray-900 dark:text-white font-medium">
                {user.department || '—'}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">College</div>
              <div className="text-gray-900 dark:text-white font-medium">
                {user.college || '—'}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Not signed in.
          </p>
        )}
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          {theme === 'dark' ? (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Appearance
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={
              theme === 'light'
                ? 'px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium'
                : 'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/40'
            }
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={
              theme === 'dark'
                ? 'px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium'
                : 'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/40'
            }
          >
            Dark
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>
        </div>

        <div className="space-y-3 text-sm">
          <label className="flex items-center justify-between gap-3">
            <span className="text-gray-700 dark:text-gray-200">Critical alerts</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={prefs.alertsCritical}
              onChange={(e) => setPrefs((p) => ({ ...p, alertsCritical: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-gray-700 dark:text-gray-200">Warning alerts</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={prefs.alertsWarning}
              onChange={(e) => setPrefs((p) => ({ ...p, alertsWarning: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-gray-700 dark:text-gray-200">Info alerts</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={prefs.alertsInfo}
              onChange={(e) => setPrefs((p) => ({ ...p, alertsInfo: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-gray-700 dark:text-gray-200">Email digest (MVP)</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={prefs.emailDigest}
              onChange={(e) => setPrefs((p) => ({ ...p, emailDigest: e.target.checked }))}
            />
          </label>

          <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
            Preferences are saved in this browser for now. Email/SMS delivery can be wired to SNS in a future iteration.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;

