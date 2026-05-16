import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { LocalAuth } from '@/lib/localAuth';
// Add page imports here
import CryptoToolkit from "./pages/CryptoToolkit";
import AuthPage from "./pages/AuthPage";
import Report from "./pages/Report";

const PrivateRoute = ({ children }) => {
  return LocalAuth.isLoggedIn() ? children : <Navigate to="/auth" replace />;
};

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<PrivateRoute><CryptoToolkit /></PrivateRoute>} />
      <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App