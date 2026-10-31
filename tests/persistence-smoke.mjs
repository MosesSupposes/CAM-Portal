import { randomUUID } from 'node:crypto';

const base = (process.env.API_BASE_URL || 'https://cam-backend.fly.dev/api/v1').replace(/\/$/, '');
const username = `camtest${Date.now()}`;
const studentId = `STU-${Date.now()}`;
const password = `Test-${randomUUID()}-Long!`;

async function call(path, method = 'GET', body, token) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await response.json();
  } catch {}
  return { status: response.status, data };
}

function check(condition, message) {
  if (!condition) throw new Error(`FAIL ${message}`);
  console.log(`PASS ${message}`);
}

const health = await call('/health');
check(health.status === 200 && health.data.status === 'healthy', 'API health');

const members = await call('/members');
check(members.status === 200 && members.data.total >= 4, 'shared member data reads from MySQL');

const accountA = await call('/auth/register', 'POST', { username, student_id: studentId, name: 'Persistence Test A', email: `${username}@example.test`, gender: 'Female', sign: 'Virgo', password });
check(accountA.status === 201, 'account registration');
const accountB = await call('/auth/register', 'POST', { username: `${username}b`, student_id: `${studentId}B`, name: 'Persistence Test B', email: `${username}b@example.test`, gender: 'Male', sign: 'Leo', password });
check(accountB.status === 201, 'second account registration');
const tokenA = accountA.data.token;
const tokenB = accountB.data.token;

check((await call('/auth/register', 'POST', { username, student_id: `${studentId}C`, name: 'Duplicate User', email: `dupe-${username}@example.test`, gender: 'Female', sign: 'Virgo', password })).status === 409, 'duplicate username is rejected');
check((await call('/auth/register', 'POST', { username: `${username}c`, student_id: studentId, name: 'Duplicate Student ID', email: `dupe-id-${username}@example.test`, gender: 'Female', sign: 'Virgo', password })).status === 409, 'duplicate Student ID is rejected');
check((await call('/entries')).status === 401, 'entries require authentication');
check((await call('/entries/house_2', 'PUT', { note: 'saved across sessions' }, tokenA)).status === 200, 'entry saves');

const entriesA = await call('/entries', 'GET', undefined, tokenA);
check(entriesA.status === 200 && entriesA.data.data.house_2.note === 'saved across sessions', 'entry reloads from MySQL');
const entriesB = await call('/entries', 'GET', undefined, tokenB);
check(entriesB.status === 200 && !entriesB.data.data.house_2, 'entries are isolated by account');

const login = await call('/auth/login', 'POST', { identifier: username, password });
const reloaded = await call('/entries', 'GET', undefined, login.data.token);
check(login.status === 200 && reloaded.data.data.house_2.note === 'saved across sessions', 'username login restores persisted entry');
const studentLogin = await call('/auth/login', 'POST', { identifier: studentId, password });
const studentReloaded = await call('/entries', 'GET', undefined, studentLogin.data.token);
check(studentLogin.status === 200 && studentReloaded.data.data.house_2.note === 'saved across sessions', 'Student ID login restores same account entry');
check((await call('/auth/logout', 'POST', {}, tokenA)).status === 200, 'logout succeeds');
check((await call('/entries', 'GET', undefined, tokenA)).status === 401, 'logout revokes token');

console.log(`CLEANUP_MEMBER_IDS=${accountA.data.user.id},${accountB.data.user.id}`);
