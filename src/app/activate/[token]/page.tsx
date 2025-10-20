'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLogger } from '@/lib/logging';

export default function ActivationPage() {
    const router = useRouter();
    const { token } = useParams() as { token: string };
    const { state, dispatch } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Attivazione del tuo account...');
    const logger = useLogger('ActivationPage');

    useEffect(() => {
        const controller = new AbortController();

        const activateAccount = async () => {
            try {
                logger.info('Starting account activation process', { tokenExists: !!token });

                const response = await fetch('/api/auth/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ token }),
                    signal: controller.signal,
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.alreadyActivated) {
                        logger.info('Account already activated', { userId: data.user?.id });
                        setStatus('success');
                        setMessage(data.message || 'Il tuo account è già stato attivato. Puoi effettuare il login.');
                    } else {
                        logger.info('Account successfully activated', { userId: data.user?.id });
                        setStatus('success');
                        setMessage('Il tuo account è stato attivato con successo! Verrai reindirizzato alla pagina iniziale.');
                        dispatch({ type: 'SET_USER', payload: data.user });
                        dispatch({ type: 'SET_AUTHENTICATED', payload: true });

                        // Redirect to home page after 3 seconds
                        setTimeout(() => {
                            router.push('/');
                        }, 3000);
                    }
                } else {
                    // Log specific API errors
                    logger.error('Account activation API error', {
                        statusCode: response.status,
                        statusText: response.statusText,
                        errorMessage: data.error,
                        token: token.substring(0, 4) + '...' // Log partial token for debugging
                    });

                    setStatus('error');
                    setMessage(data.error || 'Impossibile attivare l\'account. Riprova o contatta il supporto.');
                }
            } catch (error) {
                // Ignore abort errors (component unmounted)
                if (error instanceof Error && error.name === 'AbortError') {
                    logger.info('Account activation request aborted (component unmounted)');
                    return;
                }

                // Log unexpected errors with full details
                logger.error('Unexpected error during account activation', error, {
                    token: token.substring(0, 4) + '...', // Log partial token for debugging
                    step: 'activateAccount'
                });

                setStatus('error');
                setMessage('Si è verificato un errore imprevisto. Riprova più tardi o contatta il supporto.');
            }
        };

        if (!state.isAuthenticated) {
            activateAccount();
        } else {
            logger.warning('Attempted activation while already authenticated', {
                isAuthenticated: state.isAuthenticated,
                userId: state.user?.id
            });
            setStatus('error');
            setMessage('Sei già autenticato. Disconnettiti prima di attivare un nuovo account.');
        }

        // Cleanup function
        return () => {
            controller.abort();
        };
    }, [token, state.isAuthenticated, dispatch, router, logger]);

    return (
        <div className="flex h-screen items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Attivazione Account</CardTitle>
                    <CardDescription className="text-center">
                        {status === 'loading' && 'Stiamo processando la tua attivazione'}
                        {status === 'success' && 'Il tuo account è stato attivato!'}
                        {status === 'error' && 'Ci sono stati problemi durante l\'attivazione del tuo account'}
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
                            Torna alla Home
                        </Button>
                    )}
                    {status === 'success' && (
                        <Button disabled className="cursor-not-allowed opacity-50">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Reindirizzamento...
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
