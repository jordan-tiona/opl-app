import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../api'
import type { Player, PlayerInput } from '../types'

import { queryKeys } from './query-keys'

export const usePlayers = () => {
    return useQuery({
        queryKey: queryKeys.players,
        queryFn: api.players.list,
    })
}

export const usePlayer = (id: number) => {
    return useQuery({
        queryKey: queryKeys.player(id),
        queryFn: () => api.players.get(id),
        enabled: !!id,
    })
}

export const useCreatePlayer = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: PlayerInput) => api.players.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.players })
        },
    })
}

export const useUpdatePlayer = () => {
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
