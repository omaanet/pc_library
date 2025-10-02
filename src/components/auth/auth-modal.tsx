/* eslint-disable no-console */
// src/components/auth/auth-modal.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { LoginCredentials, RegisterCredentials, RegisterResponse } from '@/types/context';
import { USE_NEW_AUTH_FLOW } from '@/config/auth-config';

interface AuthModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: 'login' | 'register';
}

export function AuthModal({
    open,
    onOpenChange,
    defaultTab = 'login'
}: AuthModalProps) {
    const { login, register, state: { isLoading, error }, dispatch } = useAuth();
    const [activeTab, setActiveTab] = React.useState<'login' | 'register'>(defaultTab);
    const [message, setMessage] = React.useState<{ text: string; type: 'error' | 'success'; tab: 'login' | 'register' } | null>(null);

    // Login form state
    const [loginData, setLoginData] = React.useState<LoginCredentials>({
        email: '',
        password: '',
    });

    // Register form state
    const [registerData, setRegisterData] = React.useState<RegisterCredentials>({
        email: '',
        fullName: '',
    });

    // For redirection countdown after registration with new auth flow
    const [redirectCountdown, setRedirectCountdown] = React.useState<number | null>(null);
    const router = useRouter();
    
    // Ref for login email input
    const loginEmailRef = React.useRef<HTMLInputElement>(null);

    // Reset state when modal closes
    React.useEffect(() => {
        if (!open) {
            setLoginData({ email: '', password: '' });
            setRegisterData({ email: '', fullName: '' });
            setMessage(null);
            setRedirectCountdown(null);
            dispatch({ type: 'SET_ERROR', payload: null });
        }
    }, [open]);

    // Clear all errors on open/close
    React.useEffect(() => {
        setMessage(null);
        setRedirectCountdown(null);
        dispatch({ type: 'SET_ERROR', payload: null });
    }, [open]);

    // Focus email input when dialog opens on login tab
    React.useEffect(() => {
        if (open && activeTab === 'login') {
            // Small delay to ensure the dialog is fully rendered
            const timer = setTimeout(() => {
                loginEmailRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [open, activeTab]);

    // Handle countdown for redirect
    React.useEffect(() => {
        if (redirectCountdown !== null && redirectCountdown > 0) {
            const timer = setTimeout(() => {
                setRedirectCountdown(redirectCountdown - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (redirectCountdown === 0) {
            router.push('/');
            onOpenChange(false);
        }
    }, [redirectCountdown, router, onOpenChange]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            // If using new auth flow, we only need email
            if (USE_NEW_AUTH_FLOW) {
                await login({ email: loginData.email });
            } else {
                await login(loginData);
            }
            onOpenChange(false);
        } catch (error_catched) {
            setMessage({ text: error_catched instanceof Error ? error_catched.message : 'Accesso fallito', type: 'error', tab: 'login' });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            const response = await register(registerData);

            // Handle different behavior for new auth flow
            if (USE_NEW_AUTH_FLOW && response.redirectAfterSeconds) {
                // For new auth flow, start countdown for redirection
                setRedirectCountdown(response.redirectAfterSeconds);
                setMessage({
                    text: 'Registrazione effettuata con successo! Sarai reindirizzato alla home page.',
                    type: 'success',
                    tab: 'register'
                });
            } else {
                // For old auth flow, show standard success message
                setMessage({
                    text: 'Registrazione effettuata con successo! Controlla la tua email per attivare il tuo account.',
                    type: 'success',
                    tab: 'register'
                });
            }
        } catch (error_catched) {
            setMessage({ text: error_catched instanceof Error ? error_catched.message : 'Registrazione fallita', type: 'error', tab: 'register' });
        }
    };

    let dialogTitle: string, dialogDescription: string;
    if (activeTab === 'login') {
        dialogTitle = "Accedi a Racconti in Voce e Caratteri";
        dialogDescription = "Inserisci la tua email e password per accedere al tuo account";
    } else {
        dialogTitle = "Crea un Account";
        dialogDescription = "Registrati per accedere all'esperienza completa";
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                onOpenChange(newOpen);
            }}
        >
            <DialogContent className="auth-modal-container sm:max-w-[425px] px-6 pb-4">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(value: unknown) => setActiveTab(value as 'login' | 'register')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Accedi</TabsTrigger>
                        <TabsTrigger value="register">Registrati</TabsTrigger>
                    </TabsList>

                    {/* Login Tab */}
                    <TabsContent value="login">
                        {/* Unified message */}
                        {message && activeTab === 'login' && message.tab === 'login' && (
                            <Alert
                                variant={message.type === 'error' ? 'destructive' : 'default'}
                                className={`my-4 ${message.type === 'success' ? 'border-sky-500 text-sky-700 bg-sky-50' : ''}`}
                            >
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleLogin} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    ref={loginEmailRef}
                                    id="login-email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    disabled={isLoading}
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                />
                            </div>
                            {/* Only show password field for old auth flow */}
                            {!USE_NEW_AUTH_FLOW && (
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        disabled={isLoading}
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    />
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Accedi
                            </Button>
                        </form>
                    </TabsContent>

                    {/* Register Tab */}
                    <TabsContent value="register">
                        {/* Unified message */}
                        {message && activeTab === 'register' && message.tab === 'register' && (
                            <Alert
                                variant={message.type === 'error' ? 'destructive' : 'default'}
                                className={`my-4 ${message.type === 'success' ? 'border-sky-500 text-sky-700 bg-sky-50' : ''}`}
                            >
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}

                        {/* Redirect countdown for new auth flow */}
                        {redirectCountdown !== null && redirectCountdown > 0 && (
                            <div className="bg-green-100 text-green-800 text-sm p-3 rounded-md mb-4">
                                Sarai reindirizzato alla home page tra {redirectCountdown} secondi
                            </div>
                        )}
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-email">Email</Label>
                                <Input
                                    id="register-email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    disabled={isLoading}
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-name">Nome completo</Label>
                                <Input
                                    id="register-name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    disabled={isLoading}
                                    value={registerData.fullName}
                                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || redirectCountdown !== null}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registrati
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}