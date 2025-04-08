// src/context/auth-context.tsx
'use client';

import * as React from 'react';
import { createContext, useContext, useReducer, useCallback } from 'react';
import type {
    AuthState,
    AuthAction,
    AuthContextType,
    LoginCredentials,
    RegisterCredentials,
} from '@/types/context';
import type { UserPreferences } from '@/types';

const initialState: AuthState = {
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'SET_USER':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload,
            };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_AUTHENTICATED':
            return { ...state, isAuthenticated: action.payload };
        default:
            return state;
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Initialize auth state from stored session
    React.useEffect(() => {
        const initializeAuth = async () => {
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        dispatch({ type: 'SET_USER', payload: data.user });
                    }
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        initializeAuth();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            dispatch({ type: 'SET_USER', payload: data.user });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error as Error });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const register = useCallback(async (credentials: RegisterCredentials) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            // Don't set user here as they need to verify email first
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error as Error });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const logout = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (!response.ok) {
                throw new Error('Logout failed');
            }
            dispatch({ type: 'SET_USER', payload: null });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error as Error });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
        if (!state.user) throw new Error('User not authenticated');

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences),
            });

            if (!response.ok) {
                throw new Error('Failed to update preferences');
            }

            const updatedUser = {
                ...state.user,
                preferences: { ...state.user.preferences, ...preferences },
            };
            dispatch({ type: 'SET_USER', payload: updatedUser });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error as Error });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.user]);

    const value: AuthContextType = {
        state,
        dispatch,
        login,
        register,
        logout,
        updatePreferences,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}