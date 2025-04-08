/* eslint-disable no-console */
// src/components/auth/register-modal.tsx
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToLogin: () => void;
    onSuccess: () => void;
}

export function RegisterModal({
    open,
    onOpenChange,
    onSwitchToLogin,
    onSuccess
}: RegisterModalProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [fullName, setFullName] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Here you would implement your registration logic
            console.log('Registration attempt with:', { email, fullName });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            onSuccess();
        } catch (error) {
            console.error('Registration error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crea un Account</DialogTitle>
                    <DialogDescription>
                        Registrati per accedere all'esperienza completa
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nome completo</Label>
                        <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

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

                    <div className="!mt-6 space-y-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">
                                Hai già un account?{' '}
                            </span>
                            <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto"
                                onClick={onSwitchToLogin}
                                disabled={isLoading}
                            >
                                Accedi
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}