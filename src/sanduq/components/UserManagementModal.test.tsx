import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeAppUsers } from '../auth';
import { UserManagementModal } from './UserManagementModal';

describe('UserManagementModal', () => {
  it('adds a new user to the saved user list', () => {
    const onSaveUsers = vi.fn();

    render(
      <UserManagementModal
        isOpen
        onClose={vi.fn()}
        users={normalizeAppUsers([])}
        onSaveUsers={onSaveUsers}
      />
    );

    fireEvent.change(screen.getByLabelText('اسم المستخدم'), { target: { value: 'helper' } });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'Helper123' } });
    fireEvent.change(screen.getByLabelText('الاسم المعروض'), { target: { value: 'Helper' } });
    fireEvent.change(screen.getByLabelText('الصلاحية'), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'إضافة المستخدم' }));

    expect(onSaveUsers).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ username: 'helper', password: 'Helper123', displayName: 'Helper', role: 'admin' }),
    ]));
  });
});
