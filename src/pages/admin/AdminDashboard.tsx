import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mutualFundAPI, userAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { Users, TrendingUp, Settings } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSchemes: 0,
    activeSchemes: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [schemesRes, usersRes] = await Promise.all([
        mutualFundAPI.getAllSchemes(),
        userAPI.getAllUsers(),
      ]);

      console.log("Dashboard Schemes Response:", schemesRes.data); 
      console.log("Dashboard Users Response:", usersRes.data);     

     
      const getArrayFromResponse = (data: any) => {
        if (!data) return [];
        
        // 1. If it's already an array, return it
        if (Array.isArray(data)) return data;

        // 2. Check for common keys
        if (data.schemes && Array.isArray(data.schemes)) return data.schemes;
        if (data.users && Array.isArray(data.users)) return data.users;
        if (data.data && Array.isArray(data.data)) return data.data;
        if (data.result && Array.isArray(data.result)) return data.result;

        // 3. Brute Force: Find ANY key that holds an array
        const keys = Object.keys(data);
        for (const key of keys) {
          if (Array.isArray(data[key])) {
            console.log(`Found data in key: ${key}`);
            return data[key];
          }
        }

        return [];
      };

      const schemesData = getArrayFromResponse(schemesRes.data);
      const usersData = getArrayFromResponse(usersRes.data);

      console.log("Final Schemes Count:", schemesData.length);
      console.log("Final Users Count:", usersData.length);

      const activeCount = schemesData.filter((s: any) => 
        s.is_active === true || s.is_active === 1 || s.is_active === 'true'
      ).length;

      // Count only customers (ignore admins)
      const customersCount = usersData.filter((u: any) => u.role === 'CUSTOMER').length;

      setStats({
        totalSchemes: schemesData.length,
        activeSchemes: activeCount,
        // If customersCount is 0 but we have users, maybe role is missing, so show total users
        totalUsers: customersCount > 0 ? customersCount : usersData.length,
      });

    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Schemes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-2 text-gray-600">
              <TrendingUp size={24} />
              <span className="text-sm">Total Schemes</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats.totalSchemes}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {stats.activeSchemes} active
            </div>
          </div>

          {/* Card 2: Users */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-2 text-gray-600">
              <Users size={24} />
              <span className="text-sm">Total Users</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats.totalUsers}
            </div>
          </div>

          {/* Card 3: Status */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Settings size={24} />
              <span className="text-sm">System Status</span>
            </div>
            <div className="text-2xl font-bold">Active</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/admin/schemes"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <TrendingUp size={48} className="mb-3 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Manage Mutual Fund Schemes
            </h2>
            <p className="text-gray-600 text-sm">
              Create, update, delete schemes and update NAV values
            </p>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <Users size={48} className="mb-3 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              View User Portfolios
            </h2>
            <p className="text-gray-600 text-sm">
              View and monitor user investments and portfolios
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;