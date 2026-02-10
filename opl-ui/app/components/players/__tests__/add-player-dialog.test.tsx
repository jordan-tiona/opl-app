import { jest } from '@jest/globals'

import { AddPlayerDialog } from '~/components/players'
import { renderWithProviders, screen } from '~/test/test-utils'

const mockMutateAsync = jest.fn()

jest.mock('~/lib/react-query', () => ({
    useDivisions: () => ({
        data: [
            { division_id: 1, name: 'Division A', start_date: '', end_date: '', match_time: '' },
            { division_id: 2, name: 'Division B', start_date: '', end_date: '', match_time: '' },
        ],
    }),
    useCreatePlayer: () => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
    }),
}))

describe('AddPlayerDialog', () => {
    const defaultProps = {
        open: true,
        onClose: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the dialog title and form fields when open', () => {
        renderWithProviders(<AddPlayerDialog {...defaultProps} />)

        expect(screen.getByText('Add New Player')).toBeInTheDocument()
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/starting rating/i)).toBeInTheDocument()
    })

    it('does not render when closed', () => {
        renderWithProviders(<AddPlayerDialog {...defaultProps} open={false} />)

        expect(screen.queryByText('Add New Player')).not.toBeInTheDocument()
    })

    it('disables submit button when required fields are empty', () => {
        renderWithProviders(<AddPlayerDialog {...defaultProps} />)

        const submitButton = screen.getByRole('button', { name: /create player/i })

        expect(submitButton).toBeDisabled()
    })

    it('calls onClose when cancel button is clicked', () => {
        const onClose = jest.fn()

        renderWithProviders(<AddPlayerDialog {...defaultProps} onClose={onClose} />)
        screen.getByRole('button', { name: /cancel/i }).click()

        expect(onClose).toHaveBeenCalledTimes(1)
    })
})
