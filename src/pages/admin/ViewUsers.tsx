import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { Eye } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const ViewUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      console.log("Admin ViewUsers Data:", response.data); // Check console for structure

      // --- SMART DETECTION FOR USERS ---
      let allUsers: User[] = [];
      const data = response.data;

      if (Array.isArray(data)) {
        allUsers = data;
      } else if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data.users)) {
          allUsers = data.users;
        } else if (Array.isArray(data.data)) {
          allUsers = data.data;
        } else if (Array.isArray(data.result)) {
          allUsers = data.result;
        } else {
          // Find any key that holds an array
          const foundKey = Object.keys(data).find(key => Array.isArray(data[key]));
          if (foundKey) allUsers = data[foundKey];
        }
      }

      // Filter only CUSTOMERS
      const customers = allUsers.filter((u: User) => u.role === 'CUSTOMER');
      setUsers(customers);

    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewPortfolio = async (userId: number) => {
    try {
      const response = await userAPI.getUserPortfolio(userId);
      console.log("Portfolio Data:", response.data); // Debugging

      // Handle Portfolio Response Structure
      let portfolioData = response.data;
      
      // If the response is wrapped inside { data: ... } or { result: ... }
      if (portfolioData.data) portfolioData = portfolioData.data;
      else if (portfolioData.result) portfolioData = portfolioData.result;

      setSelectedUser(portfolioData);
      setShowPortfolio(true);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch user portfolio");
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          User Portfolios
        </h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!users || users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => viewPortfolio(user.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Eye size={16} />
                          <span>View Portfolio</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PORTFOLIO POPUP MODAL */}
        {showPortfolio && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  Portfolio - {selectedUser.user?.first_name || 'User'}{' '}
                  {selectedUser.user?.last_name || ''}
                </h2>
                <button
                  onClick={() => setShowPortfolio(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">
                    Total Invested
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    ₹{parseFloat(selectedUser.total_invested || 0).toFixed(2)}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">
                    Current Value
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    ₹{parseFloat(selectedUser.total_current_value || 0).toFixed(2)}
                  </div>
                </div>

                <div
                  className={`rounded-lg p-4 ${
                    parseFloat(selectedUser.total_profit_loss || 0) >= 0
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}
                >
                  <div className="text-sm text-gray-600 mb-1">
                    Profit/Loss
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      parseFloat(selectedUser.total_profit_loss || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {parseFloat(selectedUser.total_profit_loss || 0) >= 0 ? '+' : ''}
                    ₹{parseFloat(selectedUser.total_profit_loss || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Portfolio Table */}
              {(!selectedUser.portfolios || selectedUser.portfolios.length === 0) ? (
                <div className="text-center text-gray-600 py-8">
                  This user has no active investments.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Scheme
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Units
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Invested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Current NAV
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Current Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Profit/Loss
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedUser.portfolios.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.scheme_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {parseFloat(item.units).toFixed(4)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹{parseFloat(item.invested_amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹{parseFloat(item.current_nav).toFixed(4)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹{item.current_value.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`text-sm font-medium ${
                                item.profit_loss >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {item.profit_loss >= 0 ? '+' : ''}₹
                              {item.profit_loss.toFixed(2)}
                            </div>
                            <div
                              className={`text-xs ${
                                item.profit_loss >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {item.profit_loss_percentage >= 0 ? '+' : ''}
                              {item.profit_loss_percentage.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewUsers;