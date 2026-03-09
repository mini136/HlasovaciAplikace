import type { PollResponse } from '../types/poll';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const VOTER_ID_KEY = 'poll_voter_id';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // crypto.randomUUID() requires secure context (HTTPS)
    }
  }
  // Fallback for non-secure contexts (HTTP)
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function getVoterId(): string {
  const existing = localStorage.getItem(VOTER_ID_KEY);
  if (existing) {
    return existing;
  }

  const created = generateId();
  localStorage.setItem(VOTER_ID_KEY, created);
  return created;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const maybeJson = await response.json().catch(() => null);
    const message = maybeJson?.message ?? `HTTP ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : String(message));
  }
  return response.json() as Promise<T>;
}

export async function getPoll(): Promise<PollResponse> {
  const response = await fetch(`${API_BASE}/poll`);
  return parseJson<PollResponse>(response);
}

export async function vote(optionId: number): Promise<PollResponse> {
  const response = await fetch(`${API_BASE}/poll/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ optionId }),
  });
  return parseJson<PollResponse>(response);
}

export async function resetVotes(token: string): Promise<{ ok: boolean; message: string; results?: PollResponse }> {
  const response = await fetch(`${API_BASE}/poll/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return parseJson<{ ok: boolean; message: string; results?: PollResponse }>(response);
}
