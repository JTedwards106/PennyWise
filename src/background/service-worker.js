/**
 * Background Service Worker
 * Handles API calls, storage management, and background tasks
 */

import { CONFIG } from '../config/config.js';
import { geminiService } from '../services/gemini-service.js';

// Store detected product temporarily
let currentProduct = null;

/**
 * Initialize extension
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('PennyWise installed:', details.reason);
  
  // Set default preferences
  chrome.storage.local.get([CONFIG.STORAGE_KEYS.USER_PREFERENCES], (result) => {
    if (!result[CONFIG.STORAGE_KEYS.USER_PREFERENCES]) {
      chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.USER_PREFERENCES]: CONFIG.DEFAULT_PREFERENCES
      });
    }
  });

  // Set up price check alarm
  chrome.alarms.create('priceCheck', {
    periodInMinutes: CONFIG.PRICE_CHECK_INTERVAL
  });
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type);

  switch (request.type) {
    case 'PRODUCT_DETECTED':
      handleProductDetection(request.data);
      sendResponse({ success: true });
      break;

    case 'UPDATE_BADGE':
      updateBadge(request.data);
      sendResponse({ success: true });
      break;

    case 'GET_CURRENT_PRODUCT':
      sendResponse({ product: currentProduct });
      break;

    case 'SEARCH_PRICES':
      searchPrices(request.data)
        .then(results => sendResponse({ success: true, results }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response

    case 'TRACK_PRODUCT':
      trackProduct(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_RECOMMENDATIONS':
      getRecommendations(request.data)
        .then(recommendations => sendResponse({ success: true, recommendations }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

/**
 * Handle product detection from content script
 */
function handleProductDetection(productInfo) {
  console.log('Product detected:', productInfo);
  currentProduct = productInfo;
  
  // Store in chrome storage
  chrome.storage.local.set({
    [CONFIG.STORAGE_KEYS.DETECTED_PRODUCT]: productInfo
  });

  // Update badge
  updateBadge({ text: '✓', color: '#22c55e' });
}

/**
 * Update extension badge
 */
function updateBadge({ text, color }) {
  if (text !== undefined) {
    chrome.action.setBadgeText({ text: String(text) });
  }
  if (color) {
    chrome.action.setBadgeBackgroundColor({ color });
  }
}

/**
 * Search for product prices on other retailers
 */
async function searchPrices(productInfo) {
  try {
    console.log('Searching prices for:', productInfo.title);
    
    // Get user preferences
    const prefs = await getStorage(CONFIG.STORAGE_KEYS.USER_PREFERENCES);
    const preferences = prefs || CONFIG.DEFAULT_PREFERENCES;

    // Generate search queries using Gemini
    const queries = await geminiService.generateSearchQueries(productInfo);
    console.log('Generated search queries:', queries);

    // In a production environment, you would make actual searches to retailer APIs
    // For this implementation, we'll return mock data with recommendations
    const mockResults = generateMockPriceResults(productInfo, preferences);

    // Store price history
    await storePriceHistory(productInfo);

    return mockResults;
  } catch (error) {
    console.error('Error searching prices:', error);
    throw error;
  }
}

/**
 * Generate mock price comparison results
 * In production, this would make actual API calls to retailers
 */
function generateMockPriceResults(productInfo, preferences) {
  const basePrice = productInfo.price;
  const results = [];

  preferences.preferredRetailers.forEach((retailer, index) => {
    // Skip the current retailer
    if (retailer === productInfo.retailer) return;

    // Generate realistic price variations
    const variation = (Math.random() - 0.5) * 0.3; // ±15%
    const price = basePrice * (1 + variation);
    const discount = Math.random() > 0.6 ? Math.floor(Math.random() * 20) + 5 : 0;

    results.push({
      retailer,
      price: parseFloat(price.toFixed(2)),
      originalPrice: discount > 0 ? parseFloat((price * 1.1).toFixed(2)) : null,
      discount: discount > 0 ? `${discount}% off` : null,
      availability: Math.random() > 0.2 ? 'In Stock' : 'Limited Stock',
      shipping: Math.random() > 0.5 ? 'Free Shipping' : '$4.99',
      url: `https://www.${retailer.toLowerCase().replace(' ', '')}.com/search?q=${encodeURIComponent(productInfo.title.substring(0, 50))}`
    });
  });

  return results.sort((a, b) => a.price - b.price);
}

/**
 * Track a product for price monitoring
 */
async function trackProduct(productInfo) {
  try {
    const tracked = await getStorage(CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS) || [];
    
    // Check if already tracking
    const exists = tracked.some(p => 
      p.url === productInfo.url || 
      (p.productId && p.productId === productInfo.productId)
    );

    if (!exists) {
      tracked.push({
        ...productInfo,
        trackedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        priceHistory: [{ price: productInfo.price, date: new Date().toISOString() }]
      });

      await setStorage(CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS, tracked);
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Product Tracked!',
        message: `Now monitoring: ${productInfo.title.substring(0, 50)}...`
      });
    }
  } catch (error) {
    console.error('Error tracking product:', error);
    throw error;
  }
}

/**
 * Store price history for analysis
 */
async function storePriceHistory(productInfo) {
  const history = await getStorage(CONFIG.STORAGE_KEYS.PRICE_HISTORY) || {};
  const key = productInfo.productId || productInfo.url;
  
  if (!history[key]) {
    history[key] = [];
  }

  history[key].push({
    price: productInfo.price,
    retailer: productInfo.retailer,
    date: new Date().toISOString()
  });

  // Keep only last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  history[key] = history[key].filter(entry => 
    new Date(entry.date) > thirtyDaysAgo
  );

  await setStorage(CONFIG.STORAGE_KEYS.PRICE_HISTORY, history);
}

/**
 * Get AI recommendations
 */
async function getRecommendations(productInfo) {
  const prefs = await getStorage(CONFIG.STORAGE_KEYS.USER_PREFERENCES);
  const preferences = prefs || CONFIG.DEFAULT_PREFERENCES;
  
  return await geminiService.getRecommendations(productInfo, preferences);
}

/**
 * Check prices for tracked products
 */
async function checkTrackedPrices() {
  try {
    const tracked = await getStorage(CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS) || [];
    const prefs = await getStorage(CONFIG.STORAGE_KEYS.USER_PREFERENCES);
    const preferences = prefs || CONFIG.DEFAULT_PREFERENCES;

    if (!preferences.notificationsEnabled || tracked.length === 0) {
      return;
    }

    for (const product of tracked) {
      // In production, you would fetch current price from the retailer
      // For now, we'll simulate a price check
      const currentPrice = product.price * (0.9 + Math.random() * 0.2);
      const priceDropPercent = ((product.price - currentPrice) / product.price) * 100;

      if (priceDropPercent >= preferences.priceDropThreshold) {
        // Price dropped! Send notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Price Drop Alert! 🎉',
          message: `${product.title.substring(0, 50)} dropped by ${priceDropPercent.toFixed(0)}%!\nNow: $${currentPrice.toFixed(2)} (was $${product.price.toFixed(2)})`,
          priority: 2
        });
      }

      // Update last checked time
      product.lastChecked = new Date().toISOString();
    }

    await setStorage(CONFIG.STORAGE_KEYS.TRACKED_PRODUCTS, tracked);
  } catch (error) {
    console.error('Error checking tracked prices:', error);
  }
}

/**
 * Handle alarms (scheduled tasks)
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'priceCheck') {
    console.log('Running scheduled price check');
    checkTrackedPrices();
  }
});

/**
 * Helper: Get data from storage
 */
function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

/**
 * Helper: Set data in storage
 */
function setStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

console.log('PennyWise background service worker loaded');
