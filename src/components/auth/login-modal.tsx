/* eslint-disable no-console */
// src/components/auth/login-modal.tsx
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToRegister: () => void;
    onSuccess: () => void;
}

export function LoginModal({
    open,
    onOpenChange,
    onSwitchToRegister,
    onSuccess
}: LoginModalProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Here you would implement your login logic
            console.log('Login attempt with:', { email, password });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            onSuccess();
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Accedi a Racconti in Voce e Caratteri</DialogTitle>
                    <DialogDescription>
                        Inserisci la tua email e password per accedere al tuo account
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="!mt-6 space-y-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Accesso in corso...' : 'Accedi'}
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">
                                Non hai un account?{' '}
                            </span>
                            <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto"
                                onClick={onSwitchToRegister}
                                disabled={isLoading}
                            >
                                Registrati qui
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}