import { LoginPage } from './LoginPage';

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ redirect?: string; tab?: string }>;
}) {
    const { redirect, tab } = await searchParams;

    return <LoginPage redirect={redirect} defaultTab={tab === 'register' ? 'register' : 'login'} />;
}
