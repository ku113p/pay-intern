import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { RoleToggle } from './RoleToggle';
import { useAuthStore } from '../../stores/auth';

export function Layout() {
  const activeRole = useAuthStore((s) => s.activeRole);

  useEffect(() => {
    document.documentElement.setAttribute('data-role', activeRole || 'individual');
  }, [activeRole]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
      <RoleToggle />
    </div>
  );
}
