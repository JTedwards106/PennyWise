import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config/config';

/**
 * Main Popup Component
 * Displays product information, price comparisons, and recommendations
 */
function Popup() {
  const [product, setProduct] = useState(null);
  const [priceComparisons, setPriceComparisons] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('prices');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadProductData();
    loadTheme();
  }, []);

  /**
   * Load theme from storage
   */
  const loadTheme = () => {
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.THEME], (result) => {
      const savedTheme = result[CONFIG.STORAGE_KEYS.THEME] || 'light';
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    });
  };

  /**
   * Toggle theme
   */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.THEME]: newTheme });
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  /**
   * Load product data from storage and background
   */
  const loadProductData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get detected product from storage
      chrome.storage.local.get([CONFIG.STORAGE_KEYS.DETECTED_PRODUCT], async (result) => {
        const detectedProduct = result[CONFIG.STORAGE_KEYS.DETECTED_PRODUCT];
        
        if (!detectedProduct) {
          setError('No product detected on this page. Visit a product page on a supported retailer.');
          setLoading(false);
          return;
        }

        setProduct(detectedProduct);

        // Search for prices
        try {
          const priceResponse = await sendMessage({
            type: 'SEARCH_PRICES',
            data: detectedProduct
          });

          if (priceResponse.success) {
            setPriceComparisons(priceResponse.results);
          }
        } catch (err) {
          console.error('Error fetching prices:', err);
        }

        // Get recommendations
        try {
          const recsResponse = await sendMessage({
            type: 'GET_RECOMMENDATIONS',
            data: detectedProduct
          });

          if (recsResponse.success) {
            setRecommendations(recsResponse.recommendations);
          }
        } catch (err) {
          console.error('Error fetching recommendations:', err);
        }

        setLoading(false);
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  /**
   * Track product for price monitoring
   */
  const handleTrackProduct = async () => {
    try {
      const response = await sendMessage({
        type: 'TRACK_PRODUCT',
        data: product
      });

      if (response.success) {
        alert('Product added to watchlist!');
      } else {
        alert('Error: ' + response.error);
      }
    } catch (err) {
      alert('Error tracking product: ' + err.message);
    }
  };

  /**
   * Send message to background script
   */
  const sendMessage = (message) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  };

  /**
   * Open settings page
   */
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  /**
   * Refresh data
   */
  const handleRefresh = () => {
    loadProductData();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">No Product Detected</h3>
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={openSettings}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-primary-600 dark:bg-primary-700 text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold">PennyWise</h1>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-primary-700 dark:hover:bg-primary-600 rounded-lg transition"
              title="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-primary-700 dark:hover:bg-primary-600 rounded-lg transition"
              title="Refresh"
            >
              🔄
            </button>
            <button
              onClick={openSettings}
              className="p-2 hover:bg-primary-700 dark:hover:bg-primary-600 rounded-lg transition"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
        <p className="text-sm text-primary-100">Smart Shopping Assistant</p>
      </div>

      {/* Product Info */}
      {product && (
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-20 h-20 object-contain rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                {product.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.retailer}</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ${product.price.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={handleTrackProduct}
            className="mt-3 w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            📊 Track Price
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setActiveTab('prices')}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === 'prices'
              ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Price Comparison
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === 'recommendations'
              ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Recommendations
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'prices' && (
          <div className="space-y-3">
            {priceComparisons.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                No price comparisons available yet.
              </p>
            ) : (
              priceComparisons.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.retailer}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.availability}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ${item.price.toFixed(2)}
                      </p>
                      {item.originalPrice && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                          ${item.originalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{item.shipping}</span>
                    {item.discount && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                        {item.discount}
                      </span>
                    )}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block w-full text-center py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                  >
                    View on {item.retailer}
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                Loading recommendations...
              </p>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>💡</span> AI Recommendations
                </h3>
                <ul className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                      <span className="text-primary-600 dark:text-primary-400 font-bold">{index + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Popup;
