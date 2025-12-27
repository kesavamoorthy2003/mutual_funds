import { useState, useEffect } from 'react';
import { bankAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { CreditCard, Trash2, Edit2, Plus, Banknote } from 'lucide-react';

interface BankAccountData {
  id: number;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  balance: string;
}

const BankAccount = () => {
  const [account, setAccount] = useState<BankAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    balance: '', 
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const response = await bankAPI.getMyAccount();
      console.log("Bank API Response:", response.data); 

      // --- SMART DETECTION LOGIC ---
      let accData: any = null;
      const rawData = response.data;

      if (Array.isArray(rawData) && rawData.length > 0) {
        accData = rawData[0];
      } else if (rawData.results && Array.isArray(rawData.results) && rawData.results.length > 0) {
        accData = rawData.results[0];
      } else if (rawData.data && Array.isArray(rawData.data) && rawData.data.length > 0) {
        accData = rawData.data[0];
      } else if (typeof rawData === 'object' && rawData !== null) {
        if (rawData.account_number) accData = rawData;
      }

      setAccount(accData);
      
      if (accData) {
        setFormData({
          bank_name: accData.bank_name,
          account_number: accData.account_number,
          ifsc_code: accData.ifsc_code,
          balance: accData.balance,
        });
      }

    } catch (err) {
      console.error("Error fetching account:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const bankDetails = {
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        ifsc_code: formData.ifsc_code,
      };

      const newBalance = formData.balance ? parseFloat(formData.balance) : 0;
      
      // FIX: Explicitly define type as number | undefined
      let accountId: number | undefined = account?.id;

      if (account) {
        // --- UPDATE EXISTING ---
        await bankAPI.updateAccount(account.id, bankDetails);
      } else {
        // --- CREATE NEW ---
        try {
          const res = await bankAPI.createAccount({ ...bankDetails, balance: 0 });
          const data = res.data;
          // Smart detect ID from various response types
          accountId = data.id || (data.results && data.results[0]?.id) || (data.data && data.data.id);
        } catch (createErr: any) {
          if (createErr.response?.status === 400 || createErr.response?.status === 500) {
             console.warn("Account might already exist, refreshing...");
             const refreshRes = await bankAPI.getMyAccount();
             // Try to recover ID from fetch
             const existingData = refreshRes.data.results ? refreshRes.data.results[0] : (Array.isArray(refreshRes.data) ? refreshRes.data[0] : refreshRes.data);
             
             if (existingData && existingData.id) {
               accountId = existingData.id;
               await bankAPI.updateAccount(accountId as number, bankDetails);
             } else {
               throw createErr;
             }
          } else {
            throw createErr;
          }
        }
      }

      // --- FIX FOR TYPESCRIPT ERROR ---
      // Check if accountId is strictly a number before calling API
      if (typeof accountId === 'number' && !isNaN(newBalance)) {
        await bankAPI.updateBalance(accountId, newBalance, 'SET');
      }

      setSuccess('Bank details and balance saved successfully!');
      setIsEditing(false);
      setTimeout(() => fetchAccount(), 500);

    } catch (err: any) {
      console.error("Save Error:", err);
      setError(err.response?.data?.error || err.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    if (!window.confirm('Are you sure you want to delete your bank account details?')) return;

    try {
      await bankAPI.deleteAccount(account.id);
      setAccount(null);
      setFormData({ bank_name: '', account_number: '', ifsc_code: '', balance: '' });
      setSuccess('Bank account deleted successfully.');
    } catch (err) {
      setError('Failed to delete account.');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !depositAmount) return;

    const amount = parseFloat(depositAmount);
    if (amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await bankAPI.updateBalance(account.id, amount, 'ADD');
      setSuccess(`Successfully added ₹${amount}`);
      setDepositAmount('');
      fetchAccount();
    } catch (err) {
      setError('Failed to update balance');
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <CreditCard className="text-blue-600" /> Bank Account
        </h1>

        {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

        {!account || isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {account ? 'Edit Bank Details' : 'Add Bank Details'}
            </h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. State Bank of India"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1234567890"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. SBIN0001234"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Available Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  {account ? 'Update Details' : 'Save Details'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{account.bank_name}</h3>
                  <p className="text-gray-500 text-sm">Primary Account</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Account Number</label>
                  <p className="text-lg font-mono text-gray-800 tracking-wider">{account.account_number}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">IFSC Code</label>
                  <p className="text-md font-mono text-gray-800">{account.ifsc_code}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-md p-6 text-white">
              <h3 className="text-lg font-medium opacity-90 mb-1">Available Balance</h3>
              <div className="text-4xl font-bold mb-6 flex items-center gap-2">
                <Banknote size={32} /> 
                ₹{parseFloat(account.balance).toFixed(2)}
              </div>

              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <label className="block text-sm font-medium mb-2">Add Money to Wallet</label>
                <form onSubmit={handleDeposit} className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full px-3 py-2 rounded text-gray-800 focus:outline-none"
                    min="1"
                  />
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1 font-medium transition"
                  >
                    <Plus size={18} /> Add
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankAccount;