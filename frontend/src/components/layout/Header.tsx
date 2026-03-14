import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          DevStage
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/developers" className="text-gray-600 hover:text-gray-900">
            Developers
          </Link>
          {isAuthenticated && (
            <Link to="/companies" className="text-gray-600 hover:text-gray-900">
              Companies
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/listings/new" className="text-gray-600 hover:text-gray-900">
                Post Listing
              </Link>
              <Link to="/applications" className="text-gray-600 hover:text-gray-900">
                Applications
              </Link>
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
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
