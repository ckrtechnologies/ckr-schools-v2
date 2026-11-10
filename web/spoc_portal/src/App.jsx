import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ErrorBoundary from './components/ErrorBoundary';
import SpocLayout from './layouts/SpocLayout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Profile from './pages/Profile';
import Reviews from './pages/Reviews';
import Gallery from './pages/Gallery';
import Press from './pages/Press';
import Leads from './pages/Leads';

// Derived from vite `base` so the same code works at /spoc/ or at the domain root.
const BASE_PATH = import.meta.env.BASE_URL || '/';
const ROUTER_BASENAME = BASE_PATH.replace(/\/$/, '') || '/';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={ROUTER_BASENAME}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <SpocLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/press" element={<Press />} />
            <Route path="/leads" element={<Leads />} />
          </Route>
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3200} hideProgressBar />
    </ErrorBoundary>
  );
}
