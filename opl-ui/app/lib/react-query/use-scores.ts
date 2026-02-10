import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from './query-keys';

export const useScores = (divisionId: number) => {
  return useQuery({
    queryKey: queryKeys.scores(divisionId),
    queryFn: () => api.matches.scores(divisionId),
    enabled: !!divisionId,
  });
};
