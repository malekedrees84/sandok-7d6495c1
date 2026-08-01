import { AppSessionUser, AppUser, DEFAULT_APP_USERS, UserRole, USER_MANAGER_USERNAME } from './types';

export const APP_USERS_STORAGE_KEY = 'sanduq_app_users';
export const SESSION_USER_STORAGE_KEY = 'sanduq_current_user';
export const LEGACY_SESSION_ROLE_STORAGE_KEY = 'sanduq_user_role';

export const normalizeUsername = (username: string) => username.trim().toLowerCase();

const isUserRole = (role: unknown): role is UserRole => role === 'admin' || role === 'moderator';

const createUserId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const sanitizeUser = (user: Partial<AppUser>): AppUser | null => {
  const username = String(user.username || '').trim();
  const password = String(user.password || '').trim();
  const role = isUserRole(user.role) ? user.role : null;

  if (!username || !password || !role) return null;

  return {
    id: String(user.id || createUserId()),
    username,
    password,
    displayName: String(user.displayName || username).trim() || username,
    role,
  };
};

export const normalizeAppUsers = (users: Partial<AppUser>[]): AppUser[] => {
  const byUsername = new Map<string, AppUser>();

  users.forEach((user) => {
    const sanitized = sanitizeUser(user);
    if (!sanitized) return;
    byUsername.set(normalizeUsername(sanitized.username), sanitized);
  });

  DEFAULT_APP_USERS.forEach((user) => {
    const key = normalizeUsername(user.username);
    const defaultUserExists = Array.from(byUsername.values()).some((storedUser) => storedUser.id === user.id || normalizeUsername(storedUser.username) === key);
    if (!defaultUserExists) byUsername.set(key, { ...user });
  });

  return Array.from(byUsername.values());
};

export const loadAppUsers = (storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null): AppUser[] => {
  if (!storage) return normalizeAppUsers([]);

  const raw = storage.getItem(APP_USERS_STORAGE_KEY);
  if (!raw) return normalizeAppUsers([]);

  try {
    const parsed = JSON.parse(raw);
    return normalizeAppUsers(Array.isArray(parsed) ? parsed : []);
  } catch {
    return normalizeAppUsers([]);
  }
};

export const saveAppUsers = (users: AppUser[], storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return;
  storage.setItem(APP_USERS_STORAGE_KEY, JSON.stringify(normalizeAppUsers(users)));
};

export const authenticateUser = (users: AppUser[], username: string, password: string) => {
  const cleanUsername = normalizeUsername(username);
  const cleanPassword = password.trim();

  return users.find((user) => normalizeUsername(user.username) === cleanUsername && user.password === cleanPassword) || null;
};

export const toSessionUser = (user: AppUser): AppSessionUser => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  role: user.role,
});

export const canManageAppUsers = (user: AppSessionUser | null) =>
  normalizeUsername(user?.username || '') === normalizeUsername(USER_MANAGER_USERNAME);
