import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/customer/Dashboard';
import BankAccount from './pages/customer/BankAccount';
import MutualFunds from './pages/customer/MutualFunds';
import Portfolio from './pages/customer/Portfolio';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageSchemes from './pages/admin/ManageSchemes';
import ViewUsers from './pages/admin/ViewUsers';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireCustomer>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bank-account"
            element={
              <ProtectedRoute requireCustomer>
                <BankAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mutual-funds"
            element={
              <ProtectedRoute requireCustomer>
                <MutualFunds />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute requireCustomer>
                <Portfolio />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schemes"
            element={
              <ProtectedRoute requireAdmin>
                <ManageSchemes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <ViewUsers />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
}

export default App;
