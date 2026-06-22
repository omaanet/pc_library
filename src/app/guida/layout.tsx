import type { Metadata } from 'next';
import { ManagedPageGuard } from '@/components/auth/managed-page-guard';

export const metadata: Metadata = {
    title: 'Guida all’uso',
    description: 'Guida semplice alle funzioni della Biblioteca Digitale.',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
    return <ManagedPageGuard pageKey="guide">{children}</ManagedPageGuard>;
}
