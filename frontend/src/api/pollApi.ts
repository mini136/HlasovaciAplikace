import type { PollResponse } from '../types/poll';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

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
    headers: { 'Content-Type': 'application/json' },
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
