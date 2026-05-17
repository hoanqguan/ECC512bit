import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
// Add page imports here
import CryptoToolkit from "./pages/CryptoToolkit";
import Report from "./pages/Report";

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/" element={<CryptoToolkit />} />
      <Route path="/report" element={<Report />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthenticatedApp />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App