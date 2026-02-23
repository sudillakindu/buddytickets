import { Header } from '@/components/core/Header';
import { Footer } from '@/components/core/Footer';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <main className="flex-1 w-full relative flex flex-col">
                {children}
            </main>
            <Footer />
        </>
    );
}
