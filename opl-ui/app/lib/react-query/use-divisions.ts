import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query'

import { api } from '../api'
import type { CopyDivisionInput, Division, DivisionInput, Player } from '../types'

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
    { id: number; data: Partial<Division> }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Division> }) =>
            api.divisions.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisions })
            queryClient.invalidateQueries({ queryKey: queryKeys.division(id) })
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
        onSuccess: (_, { divisionId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisionPlayers(divisionId) })
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
        onSuccess: (_, { divisionId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisionPlayers(divisionId) })
        },
    })
}

export const useCopyDivision = (): UseMutationResult<
    Division,
    Error,
    { divisionId: number; data: CopyDivisionInput }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ divisionId, data }) => api.divisions.copy(divisionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisions })
        },
    })
}
