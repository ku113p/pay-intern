import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth';
import { useRoleSwitch } from '../../hooks/useRoleSwitch';
import { NotificationBell } from '../notifications/NotificationBell';
import { messagesApi } from '../../api/messages';

const NAV_LABELS = {
  individual: { post: 'Offer Services', mine: 'My Offers', applications: 'Applications' },
  organization: { post: 'Post Opportunity', mine: 'My Opportunities', applications: 'Applications' },
} as const;

function ModeToggle() {
  const activeRole = useAuthStore((s) => s.activeRole);
  const roleSwitch = useRoleSwitch();

  if (!activeRole) return null;

  const isIndividual = activeRole === 'individual';

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      <button
        onClick={() => !isIndividual && roleSwitch.mutate('individual')}
        disabled={roleSwitch.isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          isIndividual
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Professional
      </button>
      <button
        onClick={() => isIndividual && roleSwitch.mutate('organization')}
        disabled={roleSwitch.isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          !isIndividual
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Organization
      </button>
    </div>
  );
}

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const activeRole = useAuthStore((s) => s.activeRole);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  const labels = NAV_LABELS[activeRole || 'individual'];

  function navLinkClass(path: string) {
    const isActive = pathname === path || pathname.startsWith(path + '/');
    return isActive
      ? 'text-primary-600 font-medium'
      : 'text-gray-600 hover:text-primary-700';
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- closing menus on navigation is a legitimate sync pattern
  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); }, [pathname]);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <header className="bg-white border-b border-gray-200 border-t-[3px] border-t-primary-500">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
        <Link to="/" className="text-xl font-bold text-primary-600">
          HireProof
        </Link>

        {/* Hamburger toggle — mobile only */}
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

        {/* Mobile backdrop */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* ===== Desktop nav ===== */}
        <nav className="hidden md:flex items-center gap-5">
          {/* Zone A — Primary nav links */}
          <Link to="/browse" className={navLinkClass('/browse')}>Browse</Link>

          {isAuthenticated && (
            <>
              <Link to="/listings/new" className={navLinkClass('/listings/new')}>{labels.post}</Link>
              <Link to="/listings/mine" className={navLinkClass('/listings/mine')}>{labels.mine}</Link>
              <Link to="/applications" className={navLinkClass('/applications')}>{labels.applications}</Link>
              <Link to="/matches" className={navLinkClass('/matches')}>Matches</Link>

              {/* Mode toggle */}
              <div className="border-l border-gray-200 pl-3">
                <ModeToggle />
              </div>

              {/* Zone B — Icon buttons */}
              <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                <Link
                  to="/messages"
                  className="relative text-gray-500 hover:text-gray-900 h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100"
                  aria-label="Messages"
                  title="Messages"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {msgUnread && msgUnread.count > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-primary-600 text-white text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center px-0.5 leading-none">
                      {msgUnread.count > 9 ? '9+' : msgUnread.count}
                    </span>
                  )}
                </Link>
                <NotificationBell />
              </div>

              {/* Zone C — User dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 h-9 px-2 rounded-md hover:bg-gray-100"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <span className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 text-sm font-medium flex items-center justify-center">
                    {user?.display_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <svg className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.display_name || 'User'}</p>
                    </div>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      Profile
                    </Link>
                    <Link to="/saved" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      Saved
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!isAuthenticated && (
            <Link
              to="/login"
              className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700"
            >
              Sign in
            </Link>
          )}
        </nav>

        {/* ===== Mobile nav ===== */}
        <nav className={`${menuOpen ? 'flex' : 'hidden'} md:hidden flex-col items-start gap-3 absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-4 shadow-lg z-50`}>
          <Link to="/browse" className={navLinkClass('/browse')}>Browse</Link>

          {isAuthenticated ? (
            <>
              <ModeToggle />
              <div className="border-t border-gray-200 w-full pt-2 mt-1" />
              <Link to="/listings/new" className={navLinkClass('/listings/new')}>{labels.post}</Link>
              <Link to="/listings/mine" className={navLinkClass('/listings/mine')}>{labels.mine}</Link>
              <Link to="/applications" className={navLinkClass('/applications')}>{labels.applications}</Link>
              <Link to="/matches" className={navLinkClass('/matches')}>Matches</Link>
              <Link to="/messages" className={`${navLinkClass('/messages')} relative`}>
                Messages
                {msgUnread && msgUnread.count > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center bg-primary-600 text-white text-xs rounded-full h-5 min-w-5 px-1">
                    {msgUnread.count}
                  </span>
                )}
              </Link>
              <NotificationBell />
              <div className="border-t border-gray-200 w-full pt-3 mt-1 flex flex-col gap-3">
                <Link to="/saved" className={navLinkClass('/saved')}>Saved</Link>
                <Link to="/profile" className={navLinkClass('/profile')}>
                  {user?.display_name || 'Profile'}
                </Link>
                <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 text-left">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 text-center w-full"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
