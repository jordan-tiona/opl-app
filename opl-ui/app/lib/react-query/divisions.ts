import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query'

import { api } from '../api'
import type { Division, DivisionInput, DivisionUpdateInput, Player } from '../types'

import { queryKeys } from './query-keys'

export const useDivisions = (): UseQueryResult<Division[]> => {
    return useQuery({
        queryKey: queryKeys.divisions,
        queryFn: () => api.divisions.list(),
    })
}

export const useDivision = (id: number): UseQueryResult<Division> => {
    return useQuery({
        queryKey: queryKeys.division(id),
        queryFn: () => api.divisions.get(id),
        enabled: !!id,
    })
}

export const useCreateDivision = (): UseMutationResult<
    Division,
    Error,
    DivisionInput
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: DivisionInput) => api.divisions.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisions })
        },
    })
}

export const useUpdateDivision = (): UseMutationResult<
    Division,
    Error,
    { id: number; data: DivisionUpdateInput }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: DivisionUpdateInput }) =>
            api.divisions.update(id, data),
        onSuccess: (_, { id, data }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisions })
            queryClient.invalidateQueries({ queryKey: queryKeys.division(id) })
            if (data.update_existing_matches) {
                queryClient.invalidateQueries({ queryKey: ['matches'] })
            }
        },
    })
}

export const useDivisionPlayers = (divisionId: number): UseQueryResult<Player[]> => {
    return useQuery({
        queryKey: queryKeys.divisionPlayers(divisionId),
        queryFn: () => api.divisions.getPlayers(divisionId),
        enabled: !!divisionId,
    })
}

export const useAddPlayerToDivision = (): UseMutationResult<
    void,
    Error,
    { divisionId: number; playerId: number }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ divisionId, playerId }) => api.divisions.addPlayer(divisionId, playerId),
        onSuccess: (_, { divisionId, playerId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisionPlayers(divisionId) })
            queryClient.invalidateQueries({ queryKey: queryKeys.playerDivisions(playerId) })
        },
    })
}

export const useRemovePlayerFromDivision = (): UseMutationResult<
    void,
    Error,
    { divisionId: number; playerId: number }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ divisionId, playerId }) => api.divisions.removePlayer(divisionId, playerId),
        onSuccess: (_, { divisionId, playerId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisionPlayers(divisionId) })
            queryClient.invalidateQueries({ queryKey: queryKeys.playerDivisions(playerId) })
        },
    })
}

export const useDeleteDivision = (): UseMutationResult<void, Error, number> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => api.divisions.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisions })
            queryClient.invalidateQueries({ queryKey: queryKeys.division(id) })
            queryClient.invalidateQueries({ queryKey: ['matches'] })
        },
    })
}
