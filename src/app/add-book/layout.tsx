import { ManagedPageGuard } from '@/components/auth/managed-page-guard';
export default function Layout({ children }: { children: React.ReactNode }) {
    return <ManagedPageGuard pageKey="books">{children}</ManagedPageGuard>;
}
