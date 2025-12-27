import { useState, useEffect } from 'react';
import { mutualFundAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface MutualFund {
  id: number;
  name: string;
  scheme_code: string;
  description: string;
  category: string;
  nav: string;
  is_active: boolean;
}

const ManageSchemes = () => {
  const [schemes, setSchemes] = useState<MutualFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNAVForm, setShowNAVForm] = useState(false);
  const [editingScheme, setEditingScheme] = useState<MutualFund | null>(null);
  const [navScheme, setNavScheme] = useState<MutualFund | null>(null);
  const [navValue, setNavValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    scheme_code: '',
    description: '',
    category: '',
    nav: '',
    is_active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const response = await mutualFundAPI.getAllSchemes();
      console.log("Raw API Data:", response.data); // Check Console F12 if still empty

      let schemesData: MutualFund[] = [];
      const data = response.data;

      // --- SMART DETECTION LOGIC ---
      if (Array.isArray(data)) {
        // 1. Check if data is directly an array
        schemesData = data;
      } else if (typeof data === 'object' && data !== null) {
        // 2. Check common keys
        if (Array.isArray(data.schemes)) {
          schemesData = data.schemes;
        } else if (Array.isArray(data.data)) {
          schemesData = data.data;
        } else if (Array.isArray(data.result)) {
          schemesData = data.result;
        } else {
          // 3. Auto-find ANY array inside the object
          const foundKey = Object.keys(data).find(key => Array.isArray(data[key]));
          if (foundKey) {
            console.log(`Found schemes in key: '${foundKey}'`);
            schemesData = data[foundKey];
          }
        }
      }

      setSchemes(schemesData || []);
    } catch (err) {
      console.error("Error fetching schemes:", err);
      setError('Failed to fetch schemes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingScheme) {
        await mutualFundAPI.updateScheme(editingScheme.id, formData);
        setSuccess('Scheme updated successfully');
      } else {
        await mutualFundAPI.createScheme(formData);
        setSuccess('Scheme created successfully');
      }
      await fetchSchemes();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleNAVUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!navScheme) return;

    try {
      await mutualFundAPI.updateNAV(navScheme.id, parseFloat(navValue));
      setSuccess('NAV updated successfully');
      await fetchSchemes();
      setShowNAVForm(false);
      setNavScheme(null);
      setNavValue('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update NAV');
    }
  };

  const handleEdit = (scheme: MutualFund) => {
    setEditingScheme(scheme);
    setFormData({
      name: scheme.name,
      scheme_code: scheme.scheme_code,
      description: scheme.description,
      category: scheme.category,
      nav: scheme.nav,
      is_active: scheme.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheme?')) return;

    try {
      await mutualFundAPI.deleteScheme(id);
      setSuccess('Scheme deleted successfully');
      await fetchSchemes();
    } catch (err) {
      setError('Failed to delete scheme');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingScheme(null);
    setFormData({
      name: '',
      scheme_code: '',
      description: '',
      category: '',
      nav: '',
      is_active: true,
    });
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Schemes</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Scheme</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Scheme Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    NAV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!schemes || schemes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No schemes found.
                    </td>
                  </tr>
                ) : (
                  schemes.map((scheme) => (
                    <tr key={scheme.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {scheme.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {scheme.scheme_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {scheme.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₹{parseFloat(scheme.nav).toFixed(4)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            scheme.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {scheme.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => {
                            setNavScheme(scheme);
                            setNavValue(scheme.nav);
                            setShowNAVForm(true);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          Update NAV
                        </button>
                        <button
                          onClick={() => handleEdit(scheme)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={16} className="inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(scheme.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forms Code Remains Same */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingScheme ? 'Edit' : 'Add'} Scheme
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Scheme Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Scheme Code</label>
                  <input type="text" value={formData.scheme_code} onChange={(e) => setFormData({ ...formData, scheme_code: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Category</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={3} required />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Initial NAV</label>
                  <input type="number" step="0.0001" value={formData.nav} onChange={(e) => setFormData({ ...formData, nav: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="mr-2" />
                  <label className="text-gray-700">Active</label>
                </div>
                <div className="flex space-x-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button>
                  <button type="button" onClick={resetForm} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showNAVForm && navScheme && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Update NAV - {navScheme.name}</h2>
              <form onSubmit={handleNAVUpdate} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">New NAV</label>
                  <input type="number" step="0.0001" value={navValue} onChange={(e) => setNavValue(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div className="flex space-x-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Update</button>
                  <button type="button" onClick={() => { setShowNAVForm(false); setNavScheme(null); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSchemes;