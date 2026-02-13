import type {
    Player,
    PlayerInput,
    Match,
    Game,
    GameInput,
    ScheduleInput,
    Division,
    DivisionInput,
    Session,
    SessionInput,
    PlayerScore,
    User,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const STORAGE_KEY = 'opl_auth_token'

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEY)

    return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options?.headers,
        },
    })

    if (!response.ok) {
        const body = await response.json().catch(() => null)

        // Only treat as session expiry for non-auth endpoints
        if (response.status === 401 && !url.includes('/auth/')) {
            localStorage.removeItem(STORAGE_KEY)
            window.dispatchEvent(new Event('auth:expired'))
        }

        throw new Error(body?.detail ?? `API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export const api = {
    auth: {
        login: (credential: string): Promise<{ token: string; user: User }> =>
            fetchJson(`${API_BASE}/auth/login`, {
                method: 'POST',
                body: JSON.stringify({ credential }),
            }),

        me: (): Promise<User> => fetchJson(`${API_BASE}/auth/me`),
    },

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

        getDivisions: (id: number, params?: { active?: boolean }): Promise<Division[]> => {
            const searchParams = new URLSearchParams()

            if (params?.active !== undefined) {
                searchParams.set('active', params.active.toString())
            }

            const qs = searchParams.toString()

            return fetchJson(`${API_BASE}/players/${id}/divisions/${qs ? `?${qs}` : ''}`)
        },
    },

    matches: {
        list: (params: {
            start_date?: string
            end_date?: string
            player_id?: number
            match_id?: number
            session_id?: number
            division_id?: number
            completed?: boolean
        }): Promise<Match[]> => {
            const searchParams = new URLSearchParams()

            if (params.start_date) {
                searchParams.set('start_date', params.start_date)
            }

            if (params.end_date) {
                searchParams.set('end_date', params.end_date)
            }

            if (params.player_id) {
                searchParams.set('player_id', params.player_id.toString())
            }

            if (params.match_id) {
                searchParams.set('match_id', params.match_id.toString())
            }

            if (params.session_id) {
                searchParams.set('session_id', params.session_id.toString())
            }

            if (params.division_id) {
                searchParams.set('division_id', params.division_id.toString())
            }

            if (params.completed !== undefined) {
                searchParams.set('completed', params.completed.toString())
            }

            return fetchJson(`${API_BASE}/matches/?${searchParams.toString()}`)
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

        scores: (sessionId: number, divisionId?: number): Promise<PlayerScore[]> => {
            const params = new URLSearchParams({ session_id: sessionId.toString() })
            if (divisionId !== undefined) {
                params.set('division_id', divisionId.toString())
            }
            return fetchJson(`${API_BASE}/matches/scores/?${params.toString()}`)
        },
    },

    games: {
        list: (params: { match_id?: number; player_id?: number }): Promise<Game[]> => {
            const searchParams = new URLSearchParams()

            if (params.match_id) {
                searchParams.set('match_id', params.match_id.toString())
            }

            if (params.player_id) {
                searchParams.set('player_id', params.player_id.toString())
            }

            return fetchJson(`${API_BASE}/games/?${searchParams.toString()}`)
        },
    },

    divisions: {
        list: (params?: { active?: boolean }): Promise<Division[]> => {
            const searchParams = new URLSearchParams()

            if (params?.active !== undefined) {
                searchParams.set('active', params.active.toString())
            }

            const qs = searchParams.toString()

            return fetchJson(`${API_BASE}/divisions/${qs ? `?${qs}` : ''}`)
        },

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

        getPlayers: (divisionId: number): Promise<Player[]> =>
            fetchJson(`${API_BASE}/divisions/${divisionId}/players/`),

        addPlayer: (divisionId: number, playerId: number): Promise<void> =>
            fetchJson(`${API_BASE}/divisions/${divisionId}/players/${playerId}/`, {
                method: 'POST',
            }),

        removePlayer: (divisionId: number, playerId: number): Promise<void> =>
            fetchJson(`${API_BASE}/divisions/${divisionId}/players/${playerId}/`, {
                method: 'DELETE',
            }),
    },

    sessions: {
        list: (params?: { active?: boolean }): Promise<Session[]> => {
            const searchParams = new URLSearchParams()

            if (params?.active !== undefined) {
                searchParams.set('active', params.active.toString())
            }

            const qs = searchParams.toString()

            return fetchJson(`${API_BASE}/sessions/${qs ? `?${qs}` : ''}`)
        },

        get: (id: number): Promise<Session> => fetchJson(`${API_BASE}/sessions/${id}/`),

        create: (data: SessionInput): Promise<Session> =>
            fetchJson(`${API_BASE}/sessions/`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        update: (id: number, data: Partial<Session>): Promise<Session> =>
            fetchJson(`${API_BASE}/sessions/${id}/`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
    },
}
