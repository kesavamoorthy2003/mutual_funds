import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bankAPI, portfolioAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { Wallet, PieChart, TrendingUp, ShoppingCart, CreditCard } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    walletBalance: 0,
    totalInvested: 0,
    currentValue: 0,
    totalGainLoss: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bankRes, portfolioRes] = await Promise.all([
        bankAPI.getMyAccount(),
        portfolioAPI.getPortfolioSummary(),
      ]);

      console.log("Dashboard Bank Data:", bankRes.data);
      console.log("Dashboard Portfolio Data:", portfolioRes.data);

      let balance = 0;
      const bData = bankRes.data;

      if (Array.isArray(bData) && bData.length > 0) {
        balance = parseFloat(bData[0].balance);
      } else if (bData.results && Array.isArray(bData.results) && bData.results.length > 0) {
        balance = parseFloat(bData.results[0].balance); // DRF Pagination handling
      } else if (bData.balance) {
        balance = parseFloat(bData.balance);
      } else if (bData.data && bData.data.balance) {
        balance = parseFloat(bData.data.balance);
      }

      // --- 3. PROCESS PORTFOLIO DATA ---
      const pData = portfolioRes.data;
      
      const invested = parseFloat(pData.total_invested || 0);
      const current = parseFloat(pData.total_current_value || 0);
      const gainLoss = parseFloat(pData.total_profit_loss || 0);

      setStats({
        walletBalance: balance,
        totalInvested: invested,
        currentValue: current,
        totalGainLoss: gainLoss,
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Wallet Balance Card */}
          <div className="bg-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center space-x-2 mb-2 opacity-90">
              <Wallet size={24} />
              <span className="text-sm font-medium">Wallet Balance</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              ₹{stats.walletBalance.toFixed(2)}
            </div>
            <Link to="/bank-account" className="text-sm hover:underline opacity-80">
              Manage →
            </Link>
          </div>

          {/* Total Invested Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center space-x-2 mb-2 text-gray-600">
              <PieChart size={24} />
              <span className="text-sm font-medium">Total Invested</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              ₹{stats.totalInvested.toFixed(2)}
            </div>
            <Link to="/portfolio" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              View Portfolio →
            </Link>
          </div>

          {/* Current Value Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center space-x-2 mb-2 text-gray-600">
              <TrendingUp size={24} />
              <span className="text-sm font-medium">Current Value</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              ₹{stats.currentValue.toFixed(2)}
            </div>
          </div>

          {/* Total Gain/Loss Card */}
          <div className={`rounded-lg shadow-md p-6 border ${stats.totalGainLoss >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className={`flex items-center space-x-2 mb-2 ${stats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={24} />
              <span className="text-sm font-medium">Total Gain/Loss</span>
            </div>
            <div className={`text-3xl font-bold ${stats.totalGainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {stats.totalGainLoss >= 0 ? '+' : ''}₹{stats.totalGainLoss.toFixed(2)}
            </div>
          </div>
        </div>

        {/* --- QUICK ACTIONS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/mutual-funds"
            className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition group"
          >
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition">
              <ShoppingCart size={32} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Invest in Mutual Funds
            </h2>
            <p className="text-gray-600 text-sm">
              Browse and invest in various mutual fund schemes
            </p>
          </Link>

          <Link
            to="/portfolio"
            className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition group"
          >
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition">
              <PieChart size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              View Portfolio
            </h2>
            <p className="text-gray-600 text-sm">
              Check your investments and returns
            </p>
          </Link>

          <Link
            to="/bank-account"
            className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition group"
          >
            <div className="bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-100 transition">
              <CreditCard size={32} className="text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Manage Wallet
            </h2>
            <p className="text-gray-600 text-sm">
              Update bank details and add balance
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;