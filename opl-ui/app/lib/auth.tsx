import type { CredentialResponse } from '@react-oauth/google'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

import { api } from './api'
import type { User } from './types'

const STORAGE_KEY = 'opl_auth_token'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (
        response: CredentialResponse,
    ) => Promise<{ success: boolean; user?: User; error?: string }>
    demoLogin: (role: 'admin' | 'player') => Promise<{ success: boolean; user?: User; error?: string }>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)

        if (stored) {
            api.auth
                .me()
                .then(setUser)
                .catch(() => {
                    localStorage.removeItem(STORAGE_KEY)
                    setUser(null)
                })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }

        const handleExpired = () => setUser(null)

        window.addEventListener('auth:expired', handleExpired)

        return () => window.removeEventListener('auth:expired', handleExpired)
    }, [])

    const login = async (response: CredentialResponse) => {
        const credential = response.credential

        if (!credential) {
            return { success: false, error: 'No credential received' }
        }

        try {
            const result = await api.auth.login(credential)

            localStorage.setItem(STORAGE_KEY, result.token)
            flushSync(() => setUser(result.user))

            return { success: true, user: result.user }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed'

            return { success: false, error: message }
        }
    }

    const demoLogin = async (role: 'admin' | 'player') => {
        try {
            const result = await api.auth.demoLogin(role)

            localStorage.setItem(STORAGE_KEY, result.token)
            flushSync(() => setUser(result.user))

            return { success: true, user: result.user }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Demo login failed'

            return { success: false, error: message }
        }
    }

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, demoLogin, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}
