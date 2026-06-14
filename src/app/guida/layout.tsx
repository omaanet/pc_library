import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Guida all’uso',
    description: 'Guida semplice alle funzioni della Biblioteca Digitale.',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
    return children;
}
