// src/components/books/book-error-boundary.tsx
'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import {
    Alert,
    AlertTitle,
    AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class BookErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to error reporting service
        console.error('Book component error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription>
                        <p className="mb-4">
                            There was an error loading this content. Please try again.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => this.setState({ hasError: false })}
                        >
                            Try again
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        return this.props.children;
    }
}