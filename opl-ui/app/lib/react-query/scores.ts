import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { type PlayerScore } from '../../lib/types'
import { api } from '../api'

import { queryKeys } from './query-keys'

export const useScores = (sessionId: number, divisionId?: number): UseQueryResult<PlayerScore[]> => {
    return useQuery({
        queryKey: divisionId !== undefined
            ? [...queryKeys.scores(sessionId), divisionId]
            : queryKeys.scores(sessionId),
        queryFn: () => api.matches.scores(sessionId, divisionId),
        enabled: !!sessionId,
    })
}
