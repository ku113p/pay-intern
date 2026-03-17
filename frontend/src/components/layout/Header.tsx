import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../notifications/NotificationBell';
import { messagesApi } from '../../api/messages';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          HireProof
        </Link>

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
          <Link to="/browse" className="text-gray-600 hover:text-gray-900">
            Browse
          </Link>

          {isAuthenticated ? (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
              <Link to="/listings/new" className="text-gray-600 hover:text-gray-900">
                Post Listing
              </Link>
              <Link to="/listings/mine" className="text-gray-600 hover:text-gray-900">
                My Listings
              </Link>
              <Link to="/saved" className="text-gray-600 hover:text-gray-900">
                Saved
              </Link>
              <Link to="/matches" className="text-gray-600 hover:text-gray-900">
                Matches
              </Link>
              <Link to="/applications" className="text-gray-600 hover:text-gray-900">
                Applications
              </Link>
              <Link to="/messages" className="text-gray-600 hover:text-gray-900 relative">
                Messages
                {msgUnread && msgUnread.count > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-indigo-600 text-white text-xs rounded-full px-1 min-w-[16px] text-center leading-4">
                    {msgUnread.count}
                  </span>
                )}
              </Link>
              <NotificationBell />
              <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                {user?.display_name || 'Profile'}
              </Link>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 text-center w-full md:w-auto"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
