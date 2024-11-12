// src/components/auth/auth-container.tsx
'use client';

import * as React from 'react';
import { LoginModal } from './login-modal';
import { RegisterModal } from './register-modal';

export type AuthMode = 'login' | 'register' | null;

interface AuthContainerProps {
    mode: AuthMode;
    onModeChange: (mode: AuthMode) => void;
    onAuthSuccess: () => void;
}

export function AuthContainer({ mode, onModeChange, onAuthSuccess }: AuthContainerProps) {
    const handleSwitchToRegister = () => {
        onModeChange('register');
    };

    const handleSwitchToLogin = () => {
        onModeChange('login');
    };

    const handleCloseModal = () => {
        onModeChange(null);
    };

    const handleSuccess = () => {
        onAuthSuccess();
        handleCloseModal();
    };

    return (
        <>
            <LoginModal
                open={mode === 'login'}
                onOpenChange={open => !open && handleCloseModal()}
                onSwitchToRegister={handleSwitchToRegister}
                onSuccess={handleSuccess}
            />
            <RegisterModal
                open={mode === 'register'}
                onOpenChange={open => !open && handleCloseModal()}
                onSwitchToLogin={handleSwitchToLogin}
                onSuccess={handleSuccess}
            />
        </>
    );
}