'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ActivationPage() {
    const router = useRouter();
    const { token } = useParams() as { token: string };
    const { state, dispatch } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Attivazione del tuo account...');

    useEffect(() => {
        const activateAccount = async () => {
            try {
                const response = await fetch('/api/auth/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.alreadyActivated) {
                        setStatus('success');
                        setMessage(data.message || 'Il tuo account è già stato attivato. Puoi effettuare il login.');
                    } else {
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
                    setStatus('error');
                    setMessage(data.error || 'Impossibile attivare l\'account. Riprova o contatta il supporto.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Si è verificato un errore imprevisto. Riprova più tardi o contatta il supporto.');
                console.error('Activation error:', error);
            }
        };

        if (!state.isAuthenticated) {
            activateAccount();
        } else {
            setStatus('error');
            setMessage('Sei già autenticato. Disconnettiti prima di attivare un nuovo account.');
        }
    }, [token, router, state.isAuthenticated]);

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
