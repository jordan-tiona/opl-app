import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query'

import { api } from '../api'
import type { Message, MessageInput } from '../types'

import { queryKeys } from './query-keys'

export const useMessages = (): UseQueryResult<Message[]> => {
    return useQuery({
        queryKey: queryKeys.messages,
        queryFn: api.messages.list,
    })
}

export const useMessage = (id: number): UseQueryResult<Message> => {
    return useQuery({
        queryKey: queryKeys.message(id),
        queryFn: () => api.messages.get(id),
        enabled: !!id,
    })
}

export const useCreateMessage = (): UseMutationResult<
    Message,
    Error,
    MessageInput
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: MessageInput) => api.messages.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.messages })
        },
    })
}

export const useMarkMessageRead = (): UseMutationResult<void, Error, number> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => api.messages.markRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.messages })
        },
    })
}

export const useDeleteMessage = (): UseMutationResult<void, Error, number> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => api.messages.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.messages })
        },
    })
}
