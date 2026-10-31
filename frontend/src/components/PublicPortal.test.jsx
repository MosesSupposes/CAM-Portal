import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicPortal from './PublicPortal';
import AdminDashboard from './AdminDashboard';
import Navbar from './Navbar';
import { apiAuth, apiDelete, apiGet, apiPost, apiPut, setAuthToken } from '../api';

vi.mock('../api', () => ({
  apiAuth: vi.fn(),
  apiGet: vi.fn().mockResolvedValue([]),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
  apiPut: vi.fn(),
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
    apiPost.mockReset();
    apiDelete.mockReset();
    apiPut.mockReset();
    setAuthToken.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

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
    apiGet.mockImplementation(() => new Promise(() => {}));
    render(<AdminDashboard />);
    expect(screen.queryByRole('columnheader', { name: 'Member ID' })).toBeNull();
    expect(screen.getByRole('columnheader', { name: 'Gender' })).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: 'Gender / Identity' })).toBeNull();
    expect(screen.getAllByText('Non-binary')).toHaveLength(2);
    expect(screen.getByText('Female')).toBeTruthy();
    expect(screen.getByText('Male')).toBeTruthy();
  });

  it('keeps member editing controls hidden from ordinary accounts', () => {
    render(<AdminDashboard user={{ role: 'member' }} />);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: '+ Add Member' })).toBeNull();
  });

  it('lets an officer update a member through the API', async () => {
    const member = { id: 21, name: 'A Member', email: 'member@example.edu', phone: '555-0101', gender: 'Female', sign: 'Virgo', role: 'member', status: 'active' };
    apiGet.mockImplementation(path => Promise.resolve(path === '/members' ? [member] : []));
    apiPut.mockResolvedValue({ ...member, name: 'Updated Member' });
    const user = userEvent.setup();
    render(<AdminDashboard user={{ role: 'officer' }} />);

    const row = await screen.findByRole('row', { name: /A Member/ });
    await user.click(within(row).getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Full Name'));
    await user.type(screen.getByLabelText('Full Name'), 'Updated Member');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(apiPut).toHaveBeenCalledWith('/members/21', expect.objectContaining({ name: 'Updated Member', gender: 'Female', status: 'active' })));
    expect(await screen.findByText('Updated Member')).toBeTruthy();
  });

  it('allows an officer to change an individual account role', async () => {
    const member = { id: 22, name: 'New Officer', email: 'officer@example.edu', phone: '', gender: 'Male', sign: 'Leo', role: 'member', status: 'active', account_role: 'member' };
    apiGet.mockImplementation(path => Promise.resolve(path === '/members' ? [member] : []));
    apiPut.mockResolvedValue({ ...member, account_role: 'officer' });
    const user = userEvent.setup();
    render(<AdminDashboard user={{ role: 'officer' }} />);

    const row = await screen.findByRole('row', { name: /New Officer/ });
    await user.click(within(row).getByRole('button', { name: 'Edit' }));
    await user.selectOptions(screen.getByLabelText('Account Access'), 'officer');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(apiPut).toHaveBeenCalledWith('/members/22', expect.objectContaining({ account_role: 'officer' })));
    expect(await screen.findByText('officer')).toBeTruthy();
    expect(screen.queryByRole('option', { name: /superadmin/i })).toBeNull();
  });

  it('deletes a member after confirmation and removes its roster row', async () => {
    const member = { id: 31, name: 'Remove Me', email: 'remove@example.edu', phone: '', gender: 'Female', sign: 'Virgo', role: 'member', account_role: 'member', status: 'active' };
    apiGet.mockImplementation(path => Promise.resolve(path === '/members' ? [member] : []));
    apiDelete.mockResolvedValue({ id: 31 });
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);
    const user = userEvent.setup();
    render(<AdminDashboard user={{ role: 'officer' }} />);

    const row = await screen.findByRole('row', { name: /Remove Me/ });
    const deleteButton = within(row).getByRole('button', { name: 'Delete' });
    expect(deleteButton.classList.contains('cam-btn-action')).toBe(true);
    expect(deleteButton.classList.contains('cam-btn-delete')).toBe(true);
    expect(deleteButton.querySelector('svg')).toBeTruthy();
    await user.click(deleteButton);

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Delete Remove Me?'));
    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/members/31'));
    await waitFor(() => expect(screen.queryByRole('row', { name: /Remove Me/ })).toBeNull());
  });

  it('does not send a delete request when confirmation is canceled', async () => {
    const member = { id: 32, name: 'Keep Me', email: 'keep@example.edu', phone: '', gender: 'Male', sign: 'Leo', role: 'member', account_role: 'member', status: 'active' };
    apiGet.mockImplementation(path => Promise.resolve(path === '/members' ? [member] : []));
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    const user = userEvent.setup();
    render(<AdminDashboard user={{ role: 'officer' }} />);

    const row = await screen.findByRole('row', { name: /Keep Me/ });
    await user.click(within(row).getByRole('button', { name: 'Delete' }));

    expect(confirm).toHaveBeenCalledOnce();
    expect(apiDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('row', { name: /Keep Me/ })).toBeTruthy();
  });

  it('hides event scheduling and mutations from regular members', async () => {
    const event = { id: 41, title: 'Public Gathering', date: '2026-11-04T20:00', location: 'Observatory', type: 'meeting', alignment: '', description: '' };
    apiGet.mockImplementation(path => Promise.resolve(path === '/events' ? [event] : []));
    render(<AdminDashboard user={{ role: 'member' }} />);

    expect(await screen.findByText('Public Gathering')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '+ Schedule Event' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit event Public Gathering' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete event Public Gathering' })).toBeNull();
  });

  it('lets officers create, edit, and delete events through the API', async () => {
    const initialEvent = { id: 41, title: 'Public Gathering', date: '2026-11-04T20:00', location: 'Observatory', type: 'meeting', alignment: '', description: 'Original details' };
    apiGet.mockImplementation(path => Promise.resolve(path === '/events' ? [initialEvent] : []));
    apiPost.mockResolvedValue({ id: 42, title: 'New Gathering', date: '2026-11-12T18:30', location: 'Room 2', type: 'workshop', alignment: 'Full Moon', description: 'New details' });
    apiPut.mockResolvedValue({ ...initialEvent, title: 'Updated Gathering', description: 'Updated details' });
    apiDelete.mockResolvedValue({ id: 41 });
    vi.stubGlobal('confirm', vi.fn(() => true));
    const user = userEvent.setup();
    render(<AdminDashboard user={{ role: 'officer' }} />);

    await user.click(await screen.findByRole('button', { name: '+ Schedule Event' }));
    await user.type(screen.getByLabelText('Event Title'), 'New Gathering');
    await user.type(screen.getByLabelText('Date & Time'), '2026-11-12T18:30');
    await user.type(screen.getByLabelText('Location'), 'Room 2');
    await user.selectOptions(screen.getByLabelText('Event Type'), 'workshop');
    await user.type(screen.getByLabelText('Astrological Transit / Alignment'), 'Full Moon');
    await user.type(screen.getByLabelText('Description'), 'New details');
    await user.click(screen.getByRole('button', { name: 'Create Event' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/events', expect.objectContaining({ title: 'New Gathering', type: 'workshop', description: 'New details' })));
    expect(await screen.findByText('New Gathering')).toBeTruthy();

    const editEventButton = screen.getByRole('button', { name: 'Edit event Public Gathering' });
    expect(editEventButton.classList.contains('cam-btn-action')).toBe(true);
    expect(editEventButton.classList.contains('cam-btn-edit')).toBe(true);
    expect(editEventButton.querySelector('svg')).toBeTruthy();
    await user.click(editEventButton);
    await user.clear(screen.getByLabelText('Event Title'));
    await user.type(screen.getByLabelText('Event Title'), 'Updated Gathering');
    await user.click(screen.getByRole('button', { name: 'Save Event' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalledWith('/events/41', expect.objectContaining({ title: 'Updated Gathering' })));
    expect(await screen.findByText('Updated Gathering')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Delete event Updated Gathering' }));
    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/events/41'));
    expect(screen.queryByText('Updated Gathering')).toBeNull();
  });
});