import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryResult,
    type UseMutationResult,
} from '@tanstack/react-query'

import { api } from '../api'
import type { GameInput, Match, ScheduleInput } from '../types'

import { queryKeys } from './query-keys'

export const useMatches = (params: {
    start_date?: string
    end_date?: string
    player_id?: number
    division_id?: number
    completed?: boolean
}): UseQueryResult<Match[]> => {
    return useQuery({
        queryKey: queryKeys.matches(params),
        queryFn: () => api.matches.list(params),
        enabled: !!(params.start_date ?? params.player_id ?? params.division_id),
    })
}

export const useMatch = (id: number): UseQueryResult<Match> => {
    return useQuery({
        queryKey: queryKeys.match(id),
        queryFn: () => api.matches.get(id),
        enabled: !!id,
        select: (data) => data[0], // API returns array, we want single match
    })
}

export const useCompleteMatch = (): UseMutationResult<
    Match,
    Error,
    { id: number; games: GameInput[] }
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, games }: { id: number; games: GameInput[] }) =>
            api.matches.complete(id, games),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['matches'] })
            queryClient.invalidateQueries({ queryKey: queryKeys.games(id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.players })
        },
    })
}

export const useScheduleRoundRobin = (): UseMutationResult<
    Match[],
    Error,
    ScheduleInput
> => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: ScheduleInput) => api.matches.scheduleRoundRobin(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] })
        },
    })
}
