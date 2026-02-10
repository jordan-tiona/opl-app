import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

import type { User } from '~/lib/types'
import { theme } from '~/theme'

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })
}

function AllProviders({ children }: { children: React.ReactNode }) {
    const queryClient = createTestQueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </QueryClientProvider>
    )
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): ReturnType<typeof render> {
    return render(ui, { wrapper: AllProviders, ...options })
}

export function createMockUser(overrides: Partial<User> = {}): User {
    return {
        user_id: 1,
        email: 'test@example.com',
        google_id: 'google-123',
        name: 'Test User',
        picture: null,
        is_admin: false,
        player_id: 1,
        ...overrides,
    }
}

export { render } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { screen, within, waitFor } from '@testing-library/react'
