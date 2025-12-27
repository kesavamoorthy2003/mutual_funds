import { useState, useEffect } from 'react';
import { mutualFundAPI, bankAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { TrendingUp, ShoppingCart, Banknote } from 'lucide-react';

interface MutualFund {
  id: number;
  name: string;
  scheme_code: string;
  description: string;
  category: string;
  nav: string;
}

const MutualFunds = () => {
  const [schemes, setSchemes] = useState<MutualFund[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<MutualFund | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schemesRes, bankRes] = await Promise.all([
        mutualFundAPI.getAllSchemes(),
        bankAPI.getMyAccount(),
      ]);

      // Smart Detection for Schemes
      let schemesData: MutualFund[] = [];
      const sData = schemesRes.data;
      if (Array.isArray(sData)) schemesData = sData;
      else if (sData.results) schemesData = sData.results;
      else if (sData.data) schemesData = sData.data;
      setSchemes(schemesData || []);

      // Smart Detection for Balance
      const bData = bankRes.data;
      let userBalance = 0;
      if (Array.isArray(bData) && bData.length > 0) userBalance = parseFloat(bData[0].balance);
      else if (bData.results && bData.results.length > 0) userBalance = parseFloat(bData.results[0].balance);
      else if (bData.balance) userBalance = parseFloat(bData.balance);
      else if (bData.data && bData.data.balance) userBalance = parseFloat(bData.data.balance);

      setBalance(userBalance);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedScheme) return;

    const investAmount = parseFloat(amount);
    
    // Client-side Validation
    if (isNaN(investAmount) || investAmount < 100) {
      setError('Minimum investment amount is ₹100');
      return;
    }

    if (investAmount > balance) {
      setError(`Insufficient balance. You have ₹${balance.toFixed(2)}`);
      return;
    }

    try {
      // API Call
      const response = await mutualFundAPI.purchaseFund(selectedScheme.id, investAmount);
      
      
      // 1. Get new balance from response
      const newBalance = response.data.remaining_balance;
      const units = response.data.units_allotted;

      // 2. Update UI immediately
      setBalance(newBalance); 
      setSuccess(`Success! Purchased ${parseFloat(units).toFixed(4)} units. New Balance: ₹${newBalance.toFixed(2)}`);
      
      // 3. Reset Form
      setSelectedScheme(null);
      setAmount('');

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Purchase failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mutual Funds</h1>
          
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-3 shadow-lg">
            <div className="bg-white/20 p-2 rounded-full">
              <Banknote size={24} />
            </div>
            <div>
              <div className="text-xs opacity-90">Available Balance</div>
              {/* BALANCE DISPLAY */}
              <div className="text-2xl font-bold">₹{balance.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="text-green-600" size={24} />
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{scheme.category}</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{scheme.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{scheme.description}</p>
              <div className="mb-4">
                <div className="text-sm text-gray-600">Current NAV</div>
                <div className="text-2xl font-bold text-blue-600">₹{parseFloat(scheme.nav).toFixed(4)}</div>
              </div>
              <button
                onClick={() => setSelectedScheme(scheme)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <ShoppingCart size={20} />
                <span>Invest Now</span>
              </button>
            </div>
          ))}
        </div>

        {selectedScheme && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">Invest in {selectedScheme.name}</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Current NAV:</span>
                  <span className="font-bold">₹{parseFloat(selectedScheme.nav).toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Wallet:</span>
                  <span className={`font-bold text-lg ${balance < 100 ? 'text-red-500' : 'text-green-600'}`}>
                    ₹{balance.toFixed(2)}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePurchase} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Investment Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum ₹100"
                    required
                  />
                </div>
                
                {amount && parseFloat(amount) >= 100 && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-100 text-center">
                    <div className="text-sm text-gray-700">
                      You will receive approx. <br/>
                      <span className="font-bold text-lg text-blue-700">
                        {(parseFloat(amount) / parseFloat(selectedScheme.nav)).toFixed(4)} units
                      </span>
                    </div>
                    {/* Remaining Balance Preview */}
                    <div className="text-xs text-gray-500 mt-1">
                      Balance after purchase: ₹{(balance - parseFloat(amount)).toFixed(2)}
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
                    Confirm Purchase
                  </button>
                  <button type="button" onClick={() => { setSelectedScheme(null); setAmount(''); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MutualFunds;