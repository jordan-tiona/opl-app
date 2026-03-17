import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'

import { api } from '../api'
import type { GameInput, MatchScoreSubmission } from '../types'

import { queryKeys } from './query-keys'

export const useMatchScoreSubmission = (matchId: number): UseQueryResult<MatchScoreSubmission | null> => {
    return useQuery({
        queryKey: queryKeys.scoreSubmission(matchId),
        queryFn: () => api.scoreSubmissions.get(matchId),
        enabled: !!matchId,
    })
}

export const useSubmitMatchScore = (): UseMutationResult<MatchScoreSubmission, Error, { matchId: number; games: GameInput[] }> => {
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

export const useConfirmMatchScore = (): UseMutationResult<MatchScoreSubmission, Error, number> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (matchId: number) => api.scoreSubmissions.confirm(matchId),
        onSuccess: (_, matchId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.scoreSubmission(matchId) })
            queryClient.invalidateQueries({ queryKey: ['matches'] })
        },
    })
}

export const useDisputeMatchScore = (): UseMutationResult<MatchScoreSubmission, Error, number> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (matchId: number) => api.scoreSubmissions.dispute(matchId),
        onSuccess: (_, matchId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.scoreSubmission(matchId) })
            queryClient.invalidateQueries({ queryKey: ['matches'] })
        },
    })
}
