import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'

import { api } from '../api'
import type { Payment } from '../types'

import { queryKeys } from './query-keys'

export const useMatchPayments = (matchId: number): UseQueryResult<Payment[]> => {
    return useQuery({
        queryKey: queryKeys.payments(matchId),
        queryFn: () => api.payments.listForMatch(matchId),
        enabled: !!matchId,
    })
}

export const usePlayerPayments = (playerId: number): UseQueryResult<Payment[]> => {
    return useQuery({
        queryKey: queryKeys.playerPayments(playerId),
        queryFn: () => api.payments.listForPlayer(playerId),
        enabled: !!playerId,
    })
}

export const useReportPayment = (): UseMutationResult<Payment, Error, { matchId: number; paymentMethod: string }> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ matchId, paymentMethod }: { matchId: number; paymentMethod: string }) =>
            api.payments.report(matchId, paymentMethod),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.payments(data.match_id) })
            queryClient.invalidateQueries({ queryKey: ['payments', 'player'] })
        },
    })
}

export const useConfirmPayment = (): UseMutationResult<Payment, Error, { matchId: number; playerId: number }> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ matchId, playerId }: { matchId: number; playerId: number }) =>
            api.payments.confirm(matchId, playerId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.payments(data.match_id) })
            queryClient.invalidateQueries({ queryKey: ['payments', 'player'] })
            queryClient.invalidateQueries({ queryKey: ['matches'] })
        },
    })
}
