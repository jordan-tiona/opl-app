import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'

import { api } from '../api'
import type { GameInput, ScoreSubmissionResponse } from '../types'

import { queryKeys } from './query-keys'

export const useMatchScoreSubmission = (matchId: number): UseQueryResult<ScoreSubmissionResponse> => {
    return useQuery({
        queryKey: queryKeys.scoreSubmission(matchId),
        queryFn: () => api.scoreSubmissions.get(matchId),
        enabled: !!matchId,
        refetchInterval: 30_000,
    })
}

export const useSubmitMatchScore = (): UseMutationResult<ScoreSubmissionResponse, Error, { matchId: number; games: GameInput[] }> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ matchId, games }: { matchId: number; games: GameInput[] }) =>
            api.scoreSubmissions.submit(matchId, games),
        onSuccess: (_, { matchId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.scoreSubmission(matchId) })
            queryClient.invalidateQueries({ queryKey: ['matches'] })
        },
    })
}
