import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { selectStaffRole } from './auth';

describe('staff permissions', () => {
  it('grants full master access only for the admin role', () => {
    expect(selectStaffRole(['user', 'admin'])).toBe('admin');
    expect(selectStaffRole(['user'])).toBeNull();
    expect(selectStaffRole([])).toBeNull();
  });
  it('preserves moderator access without master privileges', () => {
    expect(selectStaffRole(['moderator'])).toBe('moderator');
  });
});