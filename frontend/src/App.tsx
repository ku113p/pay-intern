import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { PromoPage } from './pages/PromoPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 1000 * 60 * 2 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Standalone page — own layout, no shared header */}
          <Route path="/promo" element={<PromoPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
            <Route path="/developers" element={<DeveloperFeedPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/profiles/:type/:id" element={<PublicProfilePage />} />

            {/* Protected routes */}
            <Route path="/companies" element={<ProtectedRoute><CompanyFeedPage /></ProtectedRoute>} />
            <Route path="/listings/new" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><MyApplicationsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
