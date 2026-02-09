import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Player, PlayerInput, GameInput, ScheduleInput, Division, DivisionInput } from './types';

// Query keys
export const queryKeys = {
  players: ['players'] as const,
  player: (id: number) => ['players', id] as const,
  matches: (params: { start_date?: string; end_date?: string; player_id?: number; division_id?: number; completed?: boolean }) => ['matches', params] as const,
  match: (id: number) => ['matches', id] as const,
  games: (matchId: number) => ['games', matchId] as const,
  divisions: ['divisions'] as const,
  division: (id: number) => ['divisions', id] as const,
};

// Player queries
export const usePlayers = () => {
  return useQuery({
    queryKey: queryKeys.players,
    queryFn: api.players.list,
  });
}

export const usePlayer = (id: number) => {
  return useQuery({
    queryKey: queryKeys.player(id),
    queryFn: () => api.players.get(id),
    enabled: !!id,
  });
}

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlayerInput) => api.players.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
    },
  });
}

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Player> }) =>
      api.players.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
      queryClient.invalidateQueries({ queryKey: queryKeys.player(id) });
    },
  });
}

// Match queries
export const useMatches = (params: { start_date?: string; end_date?: string; player_id?: number; division_id?: number; completed?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.matches(params),
    queryFn: () => api.matches.list(params),
    enabled: !!(params.start_date || params.player_id || params.division_id),
  });
}

export const useMatch = (id: number) => {
  return useQuery({
    queryKey: queryKeys.match(id),
    queryFn: () => api.matches.get(id),
    enabled: !!id,
    select: (data) => data[0], // API returns array, we want single match
  });
}

export const useCompleteMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, games }: { id: number; games: GameInput[] }) =>
      api.matches.complete(id, games),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.games(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
    },
  });
}

export const useScheduleRoundRobin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleInput) => api.matches.scheduleRoundRobin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

// Division queries
export const useDivisions = () => {
  return useQuery({
    queryKey: queryKeys.divisions,
    queryFn: api.divisions.list,
  });
}

export const useDivision = (id: number) => {
  return useQuery({
    queryKey: queryKeys.division(id),
    queryFn: () => api.divisions.get(id),
    enabled: !!id,
  });
}

export const useCreateDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DivisionInput) => api.divisions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.divisions });
    },
  });
}

export const useUpdateDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Division> }) =>
      api.divisions.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.divisions });
      queryClient.invalidateQueries({ queryKey: queryKeys.division(id) });
    },
  });
}

// Score queries
export const useScores = (divisionId: number) => {
  return useQuery({
    queryKey: ['scores', divisionId] as const,
    queryFn: () => api.matches.scores(divisionId),
    enabled: !!divisionId,
  });
}

// Game queries
export const useGames = (matchId: number) => {
  return useQuery({
    queryKey: queryKeys.games(matchId),
    queryFn: () => api.games.list(matchId),
    enabled: !!matchId,
  });
}
