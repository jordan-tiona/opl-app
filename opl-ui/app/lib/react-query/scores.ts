import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { type PlayerScore } from '../../lib/types'
import { api } from '../api'

import { queryKeys } from './query-keys'

export const useScores = (divisionId: number): UseQueryResult<PlayerScore[]> => {
    return useQuery({
        queryKey: queryKeys.scores(divisionId),
        queryFn: () => api.matches.scores(divisionId),
        enabled: !!divisionId,
    })
}
