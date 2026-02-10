import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../api'
import type { Division, DivisionInput } from '../types'

import { queryKeys } from './query-keys'

export const useDivisions = () => {
    return useQuery({
        queryKey: queryKeys.divisions,
        queryFn: api.divisions.list,
    })
}

export const useDivision = (id: number) => {
    return useQuery({
        queryKey: queryKeys.division(id),
        queryFn: () => api.divisions.get(id),
        enabled: !!id,
    })
}

export const useCreateDivision = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: DivisionInput) => api.divisions.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.divisions })
        },
    })
}

export const useUpdateDivision = () => {
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
