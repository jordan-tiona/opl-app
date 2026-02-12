import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { type PlayerScore } from '../../lib/types'
import { api } from '../api'

import { queryKeys } from './query-keys'

export const useScores = (sessionId: number): UseQueryResult<PlayerScore[]> => {
    return useQuery({
        queryKey: queryKeys.scores(sessionId),
        queryFn: () => api.matches.scores(sessionId),
        enabled: !!sessionId,
    })
}
