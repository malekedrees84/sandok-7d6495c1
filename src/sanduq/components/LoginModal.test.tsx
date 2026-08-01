import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { normalizeAppUsers } from '../auth';
import { LoginModal } from './LoginModal';

describe('LoginModal', () => {
  it('logs malek in as an admin user', () => {
    const onLogin = vi.fn();

    render(
      <LoginModal
        isOpen
        onClose={vi.fn()}
        users={normalizeAppUsers([])}
        onLogin={onLogin}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('اسم المستخدم'), { target: { value: 'malek' } });
    fireEvent.change(screen.getByPlaceholderText('كلمة المرور'), { target: { value: 'Aa100300' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));

    expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ username: 'malek', role: 'admin' }));
  });
});
