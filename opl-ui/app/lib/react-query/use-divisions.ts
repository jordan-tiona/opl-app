import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query'

import { api } from '../api'
import type { Division, DivisionInput } from '../types'

import { queryKeys } from './query-keys'

export const useDivisions = (): UseQueryResult<Division[]> => {
    return useQuery({
        queryKey: queryKeys.divisions,
        queryFn: api.divisions.list,
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
