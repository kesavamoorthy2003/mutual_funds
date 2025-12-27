import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="text-xl font-bold text-blue-600">
              MF Manager
            </Link>
            {isAdmin ? (
              <>
                <Link to="/admin/schemes" className="text-gray-700 hover:text-blue-600">
                  Schemes
                </Link>
                <Link to="/admin/users" className="text-gray-700 hover:text-blue-600">
                  Users
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link to="/bank-account" className="text-gray-700 hover:text-blue-600">
                  Bank Account
                </Link>
                <Link to="/mutual-funds" className="text-gray-700 hover:text-blue-600">
                  Mutual Funds
                </Link>
                <Link to="/portfolio" className="text-gray-700 hover:text-blue-600">
                  Portfolio
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User size={20} className="text-gray-600" />
              <span className="text-gray-700">
                {user.first_name} {user.last_name} ({user.role})
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-red-600 hover:text-red-800"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
