import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from './query-keys';

export const useGames = (matchId: number) => {
  return useQuery({
    queryKey: queryKeys.games(matchId),
    queryFn: () => api.games.list(matchId),
    enabled: !!matchId,
  });
};
