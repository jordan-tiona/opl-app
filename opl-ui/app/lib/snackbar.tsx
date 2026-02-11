import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { createContext, useCallback, useContext, useState } from 'react'

type Severity = 'success' | 'error'

interface SnackbarContextValue {
    showSnackbar: (message: string, severity: Severity) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

export const useSnackbar = (): SnackbarContextValue => {
    const ctx = useContext(SnackbarContext)

    if (!ctx) {
        throw new Error('useSnackbar must be used within SnackbarProvider')
    }

    return ctx
}

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<Severity>('success')

    const showSnackbar = useCallback((message: string, severity: Severity) => {
        setMessage(message)
        setSeverity(severity)
        setOpen(true)
    }, [])

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setOpen(false)} severity={severity} variant="filled">
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    )
}
