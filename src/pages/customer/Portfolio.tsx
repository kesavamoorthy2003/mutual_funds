import { useState, useEffect } from 'react';
import { portfolioAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface PortfolioItem {
  id: number;
  scheme_name: string;
  scheme_code: string;
  units: string;
  invested_amount: string;
  current_nav: string;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
}

const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await portfolioAPI.getPortfolioSummary();
      setPortfolioData(response.data);
    } catch (err) {
      console.error(err);
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

  const portfolios: PortfolioItem[] = portfolioData?.portfolios || [];
  const totalInvested = parseFloat(portfolioData?.total_invested || 0);
  const totalCurrentValue = parseFloat(portfolioData?.total_current_value || 0);
  const totalProfitLoss = parseFloat(portfolioData?.total_profit_loss || 0);
  const profitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Portfolio</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-2">
              <PieChart size={20} className="text-blue-600" />
              <span className="text-gray-600">Total Invested</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              ₹{totalInvested.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={20} className="text-green-600" />
              <span className="text-gray-600">Current Value</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              ₹{totalCurrentValue.toFixed(2)}
            </div>
          </div>

          <div className={`rounded-lg shadow-md p-6 ${totalProfitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              {totalProfitLoss >= 0 ? (
                <TrendingUp size={20} className="text-green-600" />
              ) : (
                <TrendingDown size={20} className="text-red-600" />
              )}
              <span className="text-gray-600">Total Gain/Loss</span>
            </div>
            <div className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}₹{totalProfitLoss.toFixed(2)}
            </div>
            <div className={`text-sm ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
            </div>
          </div>
        </div>

        {portfolios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">
              You haven't invested in any mutual funds yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current NAV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gain/Loss
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolios.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.scheme_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.scheme_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(item.units).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{parseFloat(item.invested_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{parseFloat(item.current_nav).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.current_value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            item.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.profit_loss >= 0 ? '+' : ''}₹{item.profit_loss.toFixed(2)}
                        </div>
                        <div
                          className={`text-xs ${
                            item.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
