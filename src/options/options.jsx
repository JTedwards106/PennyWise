import React, { useState, useEffect } from 'react';
import { CONFIG, getApiKey, saveApiKey } from '../config/config';

/**
 * Options Page Component
 * Settings and configuration interface for PennyWise
 */
function Options() {
  const [apiKey, setApiKey] = useState('');
  const [preferences, setPreferences] = useState(CONFIG.DEFAULT_PREFERENCES);
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
    loadTrackedProducts();
  }, []);

  const loadSettings = async () => {
    const key = await getApiKey();
    if (key) setApiKey(key);
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.USER_PREFERENCES], (result) => {
      if (result[CONFIG.STORAGE_KEYS.USER_PREFERENCES]) {
        setPreferences(result[CONFIG.STORAGE_KEYS.USER_PREFERENCES]);
      }
    });
  };

  const loadTrackedProducts = () => {
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS], (result) => {
      setTrackedProducts(result[CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS] || []);
    });
  };

  const handleSave = async () => {
    try {
      await saveApiKey(apiKey);
      await new Promise((resolve) => {
        chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.USER_PREFERENCES]: preferences }, resolve);
      });
      setSaveStatus('\u2713 Settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('\u2717 Error: ' + error.message);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const toggleRetailer = (retailerName) => {
    setPreferences(prev => {
      const current = prev.preferredRetailers || [];
      const index = current.indexOf(retailerName);
      if (index > -1) {
        return { ...prev, preferredRetailers: current.filter(r => r !== retailerName) };
      } else {
        return { ...prev, preferredRetailers: [...current, retailerName] };
      }
    });
  };

  const removeTrackedProduct = (index) => {
    const updated = trackedProducts.filter((_, i) => i !== index);
    setTrackedProducts(updated);
    chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS]: updated });
  };

  const clearAllTracked = () => {
    if (confirm('Remove all tracked products?')) {
      setTrackedProducts([]);
      chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS]: [] });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-600 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold">PennyWise Settings</h1>
        <p className="text-primary-100 mt-2">Configure your shopping assistant</p>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        {saveStatus && (
          <div className={`mb-4 p-4 rounded-lg ${saveStatus.includes('\u2713') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {saveStatus}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('general')} className={`px-6 py-3 font-medium ${activeTab === 'general' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600'}`}>General</button>
            <button onClick={() => setActiveTab('api')} className={`px-6 py-3 font-medium ${activeTab === 'api' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600'}`}>API</button>
            <button onClick={() => setActiveTab('tracked')} className={`px-6 py-3 font-medium ${activeTab === 'tracked' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600'}`}>Tracked ({trackedProducts.length})</button>
          </div>
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Preferred Retailers</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {CONFIG.SUPPORTED_RETAILERS.map(r => (
                      <label key={r.name} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={preferences.preferredRetailers?.includes(r.name)} onChange={() => toggleRetailer(r.name)} className="w-4 h-4 text-primary-600" />
                        <span>{r.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={preferences.notificationsEnabled} onChange={(e) => updatePreference('notificationsEnabled', e.target.checked)} className="w-4 h-4 text-primary-600" />
                    <span>Enable price drop notifications</span>
                  </label>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Price Drop Threshold (%)</label>
                    <input type="number" value={preferences.priceDropThreshold} onChange={(e) => updatePreference('priceDropThreshold', parseInt(e.target.value) || 10)} min="1" max="90" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Price Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Price ($)</label>
                      <input type="number" value={preferences.minPrice || ''} onChange={(e) => updatePreference('minPrice', e.target.value ? parseFloat(e.target.value) : null)} placeholder="No minimum" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Price ($)</label>
                      <input type="number" value={preferences.maxPrice || ''} onChange={(e) => updatePreference('maxPrice', e.target.value ? parseFloat(e.target.value) : null)} placeholder="No maximum" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Google Gemini API Key</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">How to get your API key:</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google AI Studio</a></li>
                      <li>Sign in with your Google account and click "Get API Key"</li>
                      <li>Copy your key and paste it below</li>
                    </ol>
                    <p className="text-xs text-gray-500 mt-2">Free tier: 15 requests per minute</p>
                  </div>
                  <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your Gemini API key" className="w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  <p className="text-xs text-gray-500 mt-1">Your API key is stored locally and never shared</p>
                </div>
              </div>
            )}
            {activeTab === 'tracked' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Tracked Products</h3>
                  {trackedProducts.length > 0 && (
                    <button onClick={clearAllTracked} className="text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition">
                      Clear All
                    </button>
                  )}
                </div>
                {trackedProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-4xl mb-3">\uD83D\uDCE6</p>
                    <p>No products tracked yet.</p>
                    <p className="text-sm mt-1">Visit a product page and click "Track Price" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trackedProducts.map((p, i) => (
                      <div key={i} className="border rounded-lg p-4 flex gap-4 hover:shadow-md transition">
                        {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="w-16 h-16 object-contain rounded" />}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{p.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{p.retailer}</p>
                          <p className="text-lg font-bold text-primary-600 mt-1">${p.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">Tracked: {new Date(p.trackedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col gap-2 self-start">
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:bg-primary-50 px-3 py-1 rounded transition">View</a>
                          <button onClick={() => removeTrackedProduct(i)} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded transition">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md transition">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default Options;
