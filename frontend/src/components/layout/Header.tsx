import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth';
import { NotificationBell } from '../notifications/NotificationBell';
import { messagesApi } from '../../api/messages';

const NAV_LABELS = {
  individual: { post: 'Post Profile', mine: 'My Listings', applications: 'My Applications' },
  organization: { post: 'Post a Job', mine: 'My Listings', applications: 'Received Applications' },
} as const;

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const activeRole = useAuthStore((s) => s.activeRole);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const labels = NAV_LABELS[activeRole || 'individual'];

  function navLinkClass(path: string) {
    const isActive = pathname === path || pathname.startsWith(path + '/');
    return isActive
      ? 'text-primary-600 font-medium'
      : 'text-gray-600 hover:text-primary-700';
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- closing menu on navigation is a legitimate sync pattern
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const { data: msgUnread } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => messagesApi.getUnreadCount().then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [menuOpen]);

  return (
    <header className="bg-white border-b border-gray-200 border-t-[3px] border-t-primary-500">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-bold text-primary-600">
            HireProof
          </Link>
          {isAuthenticated && activeRole && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeRole === 'individual' ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
              {activeRole === 'individual' ? 'Individual' : 'Organization'}
            </span>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden min-h-11 min-w-11 flex items-center justify-center text-gray-600 hover:text-gray-900"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>

        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <nav className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 absolute md:static top-full left-0 right-0 bg-white md:bg-transparent border-b md:border-0 border-gray-200 p-4 md:p-0 shadow-lg md:shadow-none z-50`}>
          <Link to="/browse" className={navLinkClass('/browse')}>
            Browse
          </Link>

          {isAuthenticated ? (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
              <Link to="/listings/new" className={navLinkClass('/listings/new')}>
                {labels.post}
              </Link>
              <Link to="/listings/mine" className={navLinkClass('/listings/mine')}>
                {labels.mine}
              </Link>
              <Link to="/saved" className={navLinkClass('/saved')}>
                Saved
              </Link>
              <Link to="/matches" className={navLinkClass('/matches')}>
                Matches
              </Link>
              <Link to="/applications" className={navLinkClass('/applications')}>
                {labels.applications}
              </Link>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 md:border-l md:border-gray-200 md:pl-4">
                <Link to="/messages" className={`${navLinkClass('/messages')} relative`}>
                  Messages
                  {msgUnread && msgUnread.count > 0 && (
                    <span className="absolute -top-1.5 -right-3 bg-primary-600 text-white text-xs rounded-full px-1 min-w-[16px] text-center leading-4">
                      {msgUnread.count}
                    </span>
                  )}
                </Link>
                <NotificationBell />
                <Link to="/profile" className={navLinkClass('/profile')}>
                  {user?.display_name || 'Profile'}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 text-center w-full md:w-auto"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
