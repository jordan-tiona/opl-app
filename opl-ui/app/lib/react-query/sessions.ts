import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query'

import { api } from '../api'
import type { Session, SessionInput } from '../types'

import { queryKeys } from './query-keys'

export const useSessions = (params?: { active?: boolean; division_id?: number }): UseQueryResult<Session[]> => {
    return useQuery({
        queryKey: params?.division_id
            ? queryKeys.sessionsByDivision(params.division_id)
            : queryKeys.sessions,
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
    { id: number; data: Partial<Session> }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Session> }) =>
            api.sessions.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
            queryClient.invalidateQueries({ queryKey: queryKeys.session(id) })
        },
    })
}
