/* eslint-disable no-console */
// src/components/auth/auth-modal.tsx
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { LoginCredentials, RegisterCredentials } from '@/types/context';

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
    // Log whenever open state changes
    // React.useEffect(() => {
    //     console.log('[AuthModal] open prop changed:', open);
    // }, [open]);
    const { login, register, state: { isLoading, error } } = useAuth();
    const [activeTab, setActiveTab] = React.useState<'login' | 'register'>(defaultTab);
    const [formError, setFormError] = React.useState<string | null>(null);

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

    // Reset state when modal closes
    React.useEffect(() => {
        if (!open) {
            setLoginData({ email: '', password: '' });
            setRegisterData({ email: '', fullName: '' });
            setFormError(null);
        }
    }, [open]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        try {
            await login(loginData);
            onOpenChange(false);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        try {
            await register(registerData);
            // Show success message about email verification
            setFormError('Registration successful! Please check your email to activate your account.');
            // Optionally switch to login tab after successful registration
            setActiveTab('login');
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Registration failed');
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

    // Log render and props
    // console.log('[AuthModal] Rendering with props:', { open, defaultTab });

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                // console.log('[AuthModal] Dialog onOpenChange called with:', newOpen);
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

                    {/* Error Alert */}
                    {(error || formError) && (
                        <Alert variant={formError?.includes('successful') ? 'default' : 'destructive'}>
                            <AlertDescription>
                                {error?.message || formError}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Login Tab */}
                    <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    required
                                    disabled={isLoading}
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    required
                                    disabled={isLoading}
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Accedi
                            </Button>
                        </form>
                    </TabsContent>

                    {/* Register Tab */}
                    <TabsContent value="register">
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-email">Email</Label>
                                <Input
                                    id="register-email"
                                    type="email"
                                    required
                                    disabled={isLoading}
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-name">Nome completo</Label>
                                <Input
                                    id="register-name"
                                    type="text"
                                    required
                                    disabled={isLoading}
                                    value={registerData.fullName}
                                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
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