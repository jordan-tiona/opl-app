import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from 'react-router'

import type { Route } from './+types/root'
import { AuthProvider } from './lib/auth'
import { theme } from './theme'
import './app.css'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
})

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export const App = () => {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_OPL_CLIENT_ID}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <AuthProvider>
                        <Outlet />
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GoogleOAuthProvider>
    )
}

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
    let message = 'Oops!'
    let details = 'An unexpected error occurred.'
    let stack: string | undefined

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? '404' : 'Error'
        details =
            error.status === 404
                ? 'The requested page could not be found.'
                : error.statusText || details
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message
        stack = error.stack
    }

    return (
        <main style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre
                    style={{
                        width: '100%',
                        padding: '1rem',
                        overflow: 'auto',
                        background: '#f5f5f5',
                        textAlign: 'left',
                    }}
                >
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    )
}

export default App
