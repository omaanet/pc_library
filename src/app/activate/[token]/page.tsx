'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default async function ActivationPage({ params }: { params: Promise<{ token: string }> }) {
    const awaitedParams = await params;
    const { token } = awaitedParams;
    const router = useRouter();
    const { state } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Activating your account...');

    useEffect(() => {
        const activateAccount = async () => {
            try {
                const response = await fetch('/api/auth/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage('Your account has been activated successfully! You will be redirected to the home page.');

                    // Redirect to home page after 3 seconds
                    setTimeout(() => {
                        router.push('/');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Failed to activate your account. Please try again or contact support.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An unexpected error occurred. Please try again later or contact support.');
                console.error('Activation error:', error);
            }
        };

        if (!state.isAuthenticated) {
            activateAccount();
        } else {
            setStatus('error');
            setMessage('You are already logged in. Please log out before activating a new account.');
        }
    }, [token, router, state.isAuthenticated]);

    return (
        <div className="container flex items-center justify-center min-h-screen py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Account Activation</CardTitle>
                    <CardDescription className="text-center">
                        {status === 'loading' && 'We are processing your account activation'}
                        {status === 'success' && 'Your account has been activated!'}
                        {status === 'error' && 'There was a problem activating your account'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                    {status === 'loading' && (
                        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                    )}
                    {status === 'success' && (
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    )}
                    {status === 'error' && (
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    )}
                    <p className="text-center mt-4">{message}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    {status === 'error' && (
                        <Button onClick={() => router.push('/')}>
                            Return to Home
                        </Button>
                    )}
                    {status === 'success' && (
                        <Button disabled className="cursor-not-allowed opacity-50">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirecting...
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
