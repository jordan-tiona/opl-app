import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query'

import { api } from '../api'
import type { Session, SessionInput, SessionUpdateInput } from '../types'

import { queryKeys } from './query-keys'

export const useSessions = (params?: { active?: boolean }): UseQueryResult<Session[]> => {
    return useQuery({
        queryKey: queryKeys.sessions,
        queryFn: () => api.sessions.list(params),
    })
}

export const useSession = (id: number): UseQueryResult<Session> => {
    return useQuery({
        queryKey: queryKeys.session(id),
        queryFn: () => api.sessions.get(id),
        enabled: !!id,
    })
}

export const useCreateSession = (): UseMutationResult<
    Session,
    Error,
    SessionInput
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: SessionInput) => api.sessions.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
        },
    })
}

export const useUpdateSession = (): UseMutationResult<
    Session,
    Error,
    { id: number; data: SessionUpdateInput }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SessionUpdateInput }) =>
            api.sessions.update(id, data),
        onSuccess: (_, { id, data }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
            queryClient.invalidateQueries({ queryKey: queryKeys.session(id) })
            if (data.update_existing_matches) {
                queryClient.invalidateQueries({ queryKey: ['matches'] })
            }
        },
    })
}

export const useDeleteSession = (): UseMutationResult<void, Error, number> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => api.sessions.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
            queryClient.invalidateQueries({ queryKey: queryKeys.session(id) })
            queryClient.invalidateQueries({ queryKey: ['matches'] })
        },
    })
}
