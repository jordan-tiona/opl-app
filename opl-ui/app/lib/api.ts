import type { Player, PlayerInput, Match, Game, GameInput, ScheduleInput, Division, DivisionInput } from './types';

const API_BASE = 'http://localhost:8000';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  players: {
    list: (): Promise<Player[]> => fetchJson(`${API_BASE}/players/`),

    get: (id: number): Promise<Player> => fetchJson(`${API_BASE}/players/${id}/`),

    create: (data: PlayerInput): Promise<Player> =>
      fetchJson(`${API_BASE}/players/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: Partial<Player>): Promise<Player> =>
      fetchJson(`${API_BASE}/players/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  matches: {
    list: (params: { start_date?: string; end_date?: string; player_id?: number; match_id?: number; completed?: boolean }): Promise<Match[]> => {
      const searchParams = new URLSearchParams();
      if (params.start_date) searchParams.set('start_date', params.start_date);
      if (params.end_date) searchParams.set('end_date', params.end_date);
      if (params.player_id) searchParams.set('player_id', params.player_id.toString());
      if (params.match_id) searchParams.set('match_id', params.match_id.toString());
      if (params.completed !== undefined) searchParams.set('completed', params.completed.toString());
      return fetchJson(`${API_BASE}/matches/?${searchParams.toString()}`);
    },

    get: (id: number): Promise<Match[]> => fetchJson(`${API_BASE}/matches/?match_id=${id}`),

    create: (data: Omit<Match, 'match_id'>): Promise<Match> =>
      fetchJson(`${API_BASE}/matches/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    complete: (id: number, games: GameInput[]): Promise<Match> =>
      fetchJson(`${API_BASE}/matches/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(games),
      }),

    scheduleRoundRobin: (data: ScheduleInput): Promise<Match[]> =>
      fetchJson(`${API_BASE}/matches/schedule-round-robin/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  games: {
    list: (matchId: number): Promise<Game[]> =>
      fetchJson(`${API_BASE}/games/?match_id=${matchId}`),
  },

  divisions: {
    list: (): Promise<Division[]> => fetchJson(`${API_BASE}/divisions/`),

    get: (id: number): Promise<Division> => fetchJson(`${API_BASE}/divisions/${id}/`),

    create: (data: DivisionInput): Promise<Division> =>
      fetchJson(`${API_BASE}/divisions/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: Partial<Division>): Promise<Division> =>
      fetchJson(`${API_BASE}/divisions/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
