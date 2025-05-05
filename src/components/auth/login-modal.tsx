// src/components/auth/login-modal.tsx
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth-context';
import { AlertCircle } from 'lucide-react';

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
    const [error, setError] = React.useState<string | null>(null);

    const { login } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Clear errors when modal opens
    React.useEffect(() => {
        if (open) setError(null);
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Use the login function from auth context
            await login({ email, password });

            // Show success toast
            toast({
                title: 'Login Successful',
                description: 'You have successfully logged in to your account.',
                variant: 'default',
            });

            // Check if there's a redirect URL in the search params
            const redirectUrl = searchParams?.get('redirect');
            if (redirectUrl) {
                // Navigate to the redirect URL if provided
                router.push(decodeURIComponent(redirectUrl));
            } else {
                // Otherwise close the modal and call the success handler
                onSuccess();
            }
        } catch (error) {
            // Set the error message
            setError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');

            // Show error toast
            toast({
                title: 'Login Failed',
                description: error instanceof Error ? error.message : 'Login failed. Please check your credentials.',
                variant: 'destructive',
            });
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
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="username"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
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