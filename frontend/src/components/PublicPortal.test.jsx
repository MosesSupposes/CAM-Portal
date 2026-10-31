import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicPortal from './PublicPortal';
import AdminDashboard from './AdminDashboard';
import Navbar from './Navbar';
import { apiAuth, apiGet, setAuthToken } from '../api';

vi.mock('../api', () => ({
  apiAuth: vi.fn(),
  apiGet: vi.fn().mockResolvedValue([]),
  setAuthToken: vi.fn(),
}));

function renderPortal(overrides = {}) {
  const props = {
    onOpenWheel: vi.fn(),
    user: null,
    setUser: vi.fn(),
    accountMode: 'register',
    setAccountMode: vi.fn(),
    focusNameSignal: 0,
    ...overrides,
  };
  return { ...render(<PublicPortal {...props} />), props };
}

describe('onboarding account form', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    apiAuth.mockReset();
    apiGet.mockResolvedValue([]);
    setAuthToken.mockReset();
  });

  afterEach(() => cleanup());

  it('starts with Name then Student ID and focuses Name when opened from Account', () => {
    renderPortal({ focusNameSignal: 1 });
    const name = screen.getByLabelText('Name');
    const studentId = screen.getByLabelText('Student ID');
    expect(name.compareDocumentPosition(studentId) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.activeElement).toBe(name);
  });

  it('switches to sign-in within onboarding and accepts a Student ID identifier', async () => {
    const user = userEvent.setup();
    const view = renderPortal();
    const { props } = view;
    await user.click(screen.getByRole('button', { name: 'Already a member? Sign in.' }));
    expect(props.setAccountMode).toHaveBeenCalledWith('login');
    view.rerender(<PublicPortal {...props} accountMode="login" />);
    expect(screen.getByRole('heading', { name: 'Welcome back, Stargazer.' })).toBeTruthy();
    expect(screen.getByText('Sign in to revisit your saved chart notes and reconnect with the C.A.M. community.')).toBeTruthy();
    expect(screen.getByLabelText('Username or Student ID')).toBeTruthy();
    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('Username or Student ID'));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    view.rerender(<PublicPortal {...props} accountMode="register" />);
    expect(document.activeElement).toBe(screen.getByLabelText('Name'));
  });

  it('submits Student ID and profile data when creating an account', async () => {
    const user = userEvent.setup();
    const { props } = renderPortal();
    apiAuth.mockResolvedValue({ token: 'test-token', user: { id: 7, name: 'A Student', username: 'astudent' } });
    await user.type(screen.getByLabelText('Name'), 'A Student');
    await user.type(screen.getByLabelText('Student ID'), 'STU-24680');
    await user.type(screen.getByLabelText('Username'), 'astudent');
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple');
    await user.type(screen.getByLabelText('Student Email Address'), 'student@example.edu');
    await user.type(screen.getByLabelText('Phone Number (optional)'), '555-0100');
    await user.selectOptions(screen.getByLabelText('Gender'), 'Non-binary');
    await user.selectOptions(screen.getByLabelText('Your Sun Sign'), 'Virgo');
    expect(screen.getByLabelText('What draws you to astrology? (optional)').required).toBe(false);
    expect(screen.getByLabelText('Phone Number (optional)').required).toBe(false);
    const signupForm = screen.getByLabelText('Name').closest('form');
    expect(Array.from(signupForm.querySelectorAll('input, select, textarea')).every(field => field.required || ['account-phone', 'interest'].includes(field.id))).toBe(true);
    expect(Array.from(screen.getByLabelText('Gender').options).map(option => option.value)).toEqual(['', 'Male', 'Female', 'Non-binary']);
    fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form'));
    await waitFor(() => expect(apiAuth).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
      name: 'A Student',
      student_id: 'STU-24680',
      username: 'astudent',
      email: 'student@example.edu',
      phone_number: '555-0100',
      gender: 'Non-binary',
    })));
    expect(setAuthToken).toHaveBeenCalledWith('test-token');
    expect(props.setUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'A Student' }));
  });

  it('submits the Student ID as the sign-in identifier', async () => {
    const user = userEvent.setup();
    const props = { user: null, setUser: vi.fn(), accountMode: 'login', setAccountMode: vi.fn(), focusNameSignal: 0 };
    apiAuth.mockResolvedValue({ token: 'test-token', user: { id: 8, name: 'A Student' } });
    render(<PublicPortal {...props} />);
    await user.type(screen.getByLabelText('Username or Student ID'), 'STU-24680');
    await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(apiAuth).toHaveBeenCalledWith('/auth/login', {
      identifier: 'STU-24680',
      password: 'correct-horse-battery-staple',
    }));
  });

  it('keeps the navbar Account action in nav and sends it to onboarding', async () => {
    const user = userEvent.setup();
    const onOpenAccount = vi.fn();
    render(<Navbar currentView="portal" setView={vi.fn()} theme="dark" setTheme={vi.fn()} user={null} setUser={vi.fn()} onOpenAccount={onOpenAccount} />);
    await user.click(screen.getByRole('button', { name: 'Account' }));
    expect(onOpenAccount).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(screen.getByRole('navigation').lastElementChild.textContent).toBe('☀️');
  });

  it('labels the member roster column Gender', () => {
    render(<AdminDashboard />);
    expect(screen.getByRole('columnheader', { name: 'Gender' })).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: 'Gender / Identity' })).toBeNull();
  });
});