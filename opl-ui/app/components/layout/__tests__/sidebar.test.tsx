import { jest } from '@jest/globals'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { User } from '~/lib/types'
import { createMockUser } from '~/test/test-utils'
import { theme } from '~/theme'

interface MockAuth {
    user: User
    loading: boolean
    login: ReturnType<typeof jest.fn>
    logout: ReturnType<typeof jest.fn>
}

let mockAuthReturn: MockAuth

jest.unstable_mockModule('~/lib/auth', () => ({
    useAuth: () => mockAuthReturn,
}))

const { Sidebar } = await import('~/components/layout/sidebar')

function renderSidebar(initialRoute = '/dashboard') {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })

    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={[initialRoute]}>
                    <Sidebar open={true} onClose={jest.fn()} />
                </MemoryRouter>
            </ThemeProvider>
        </QueryClientProvider>,
    )
}

describe('Sidebar', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockAuthReturn = {
            user: createMockUser(),
            loading: false,
            login: jest.fn(),
            logout: jest.fn(),
        }
    })

    it('shows player nav items for non-admin user', () => {
        mockAuthReturn.user = createMockUser({ is_admin: false })

        renderSidebar()

        expect(screen.getByText('My Profile')).toBeInTheDocument()
        expect(screen.getByText('Standings')).toBeInTheDocument()
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
        expect(screen.queryByText('Players')).not.toBeInTheDocument()
    })

    it('shows admin nav items for admin user', () => {
        mockAuthReturn.user = createMockUser({ is_admin: true })

        renderSidebar()

        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Players')).toBeInTheDocument()
        expect(screen.getByText('Divisions')).toBeInTheDocument()
        expect(screen.getByText('Matches')).toBeInTheDocument()
        expect(screen.getByText('Standings')).toBeInTheDocument()
    })

    it('displays user name', () => {
        mockAuthReturn.user = createMockUser({ name: 'John Doe' })

        renderSidebar()

        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('displays the app title', () => {
        renderSidebar()

        expect(screen.getByText('One Pocket League')).toBeInTheDocument()
    })
})
