import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query'

import { api } from '../api'
import type { Division, Player, PlayerInput } from '../types'

import { queryKeys } from './query-keys'

export const usePlayers = (): UseQueryResult<Player[]> => {
    return useQuery({
        queryKey: queryKeys.players,
        queryFn: api.players.list,
    })
}

export const usePlayer = (id: number): UseQueryResult<Player> => {
    return useQuery({
        queryKey: queryKeys.player(id),
        queryFn: () => api.players.get(id),
        enabled: !!id,
    })
}

export const useCreatePlayer = (): UseMutationResult<
    Player,
    Error,
    PlayerInput
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: PlayerInput) => api.players.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.players })
        },
    })
}

export const usePlayerDivisions = (playerId: number, active?: boolean): UseQueryResult<Division[]> => {
    return useQuery({
        queryKey: queryKeys.playerDivisions(playerId),
        queryFn: () => api.players.getDivisions(playerId, { active }),
        enabled: !!playerId,
    })
}

export const useUpdatePlayer = (): UseMutationResult<
    Player,
    Error,
    { id: number; data: Partial<Player> }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Player> }) =>
            api.players.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.players })
            queryClient.invalidateQueries({ queryKey: queryKeys.player(id) })
        },
    })
}
