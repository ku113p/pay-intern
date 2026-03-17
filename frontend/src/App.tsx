import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ErrorFallback } from './components/common/ErrorFallback';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MagicLinkVerifyPage } from './pages/MagicLinkVerifyPage';
import { DeveloperFeedPage } from './pages/DeveloperFeedPage';
import { CompanyFeedPage } from './pages/CompanyFeedPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { MyApplicationsPage } from './pages/MyApplicationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { MyListingsPage } from './pages/MyListingsPage';
import { EditListingPage } from './pages/EditListingPage';
import { ReviewPage } from './pages/ReviewPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SavedListingsPage } from './pages/SavedListingsPage';
import { MatchesPage } from './pages/MatchesPage';
import { MessagesPage } from './pages/MessagesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 1000 * 60 * 2 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={console.error}>
      <BrowserRouter>
        <Routes>
          {/* Landing page for logged-out users is standalone (own nav) */}
          <Route path="/" element={<HomePage />} />

          <Route element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
            <Route path="/developers" element={<DeveloperFeedPage />} />
            <Route path="/listings/mine" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
            <Route path="/listings/:id/edit" element={<ProtectedRoute><EditListingPage /></ProtectedRoute>} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/profiles/:type/:id" element={<PublicProfilePage />} />

            {/* Protected routes */}
            <Route path="/companies" element={<ProtectedRoute><CompanyFeedPage /></ProtectedRoute>} />
            <Route path="/listings/new" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
            <Route path="/applications/:applicationId/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><MyApplicationsPage /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedListingsPage /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
            <Route path="/messages/:applicationId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
