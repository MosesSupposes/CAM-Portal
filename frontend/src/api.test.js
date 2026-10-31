import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiAuth } from './api';

describe('API response errors', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the backend error body when available', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ message: 'Database unavailable' }),
    }));

    await expect(apiAuth('/auth/register', {})).rejects.toThrow('Database unavailable');
  });

  it('reports the HTTP status when an error response is empty', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => '',
    }));

    await expect(apiAuth('/auth/register', {})).rejects.toThrow('Request failed: 502');
  });
});