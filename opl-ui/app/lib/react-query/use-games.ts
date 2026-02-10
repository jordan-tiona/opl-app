import { useQuery } from '@tanstack/react-query'

import { api } from '../api'

import { queryKeys } from './query-keys'

export const useGames = (params: { match_id?: number; player_id?: number }) => {
    const key = params.match_id
        ? queryKeys.games(params.match_id)
        : ['games', 'player', params.player_id]

    return useQuery({
        queryKey: key,
        queryFn: () => api.games.list(params),
        enabled: !!(params.match_id || params.player_id),
    })
}
