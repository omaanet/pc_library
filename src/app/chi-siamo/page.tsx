import type { Metadata } from 'next';
import { AboutPage } from '@/components/about/about-page';

export const metadata: Metadata = {
    title: 'Chi siamo',
    description: 'La storia di Piero Carbonetti e del progetto gratuito e solidale Racconti in Voce e Caratteri.',
};

export default function ChiSiamoPage() {
    return <AboutPage />;
}
