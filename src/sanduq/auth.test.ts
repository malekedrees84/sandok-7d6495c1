import { describe, expect, it } from 'vitest';
import { authenticateUser, canManageAppUsers, normalizeAppUsers, toSessionUser } from './auth';

describe('sanduq auth helpers', () => {
  it('seeds Admin and malek users', () => {
    const users = normalizeAppUsers([]);

    expect(authenticateUser(users, 'Admin', 'Admin123')?.role).toBe('admin');
    expect(authenticateUser(users, 'malek', 'Aa100300')?.role).toBe('admin');
  });

  it('allows only malek to manage users', () => {
    const users = normalizeAppUsers([]);
    const malek = authenticateUser(users, 'malek', 'Aa100300');
    const admin = authenticateUser(users, 'Admin', 'Admin123');

    expect(canManageAppUsers(malek ? toSessionUser(malek) : null)).toBe(true);
    expect(canManageAppUsers(admin ? toSessionUser(admin) : null)).toBe(false);
  });

  it('does not duplicate a default user after editing it', () => {
    const users = normalizeAppUsers([
      { id: 'admin-main', username: 'MainAdmin', password: 'Admin123', displayName: 'Main Admin', role: 'admin' },
    ]);

    expect(users.filter((user) => user.id === 'admin-main')).toHaveLength(1);
  });
});
