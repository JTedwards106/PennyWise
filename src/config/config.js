/**
 * Configuration file for PennyWise Chrome Extension
 * 
 * IMPORTANT: Before using this extension, you need to:
 * 1. Get a Gemini API key from https://makersuite.google.com/app/apikey
 * 2. Store it in Chrome Storage via the Options page
 */

export const CONFIG = {
  // Gemini API Configuration
  GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  GEMINI_API_KEY_STORAGE_KEY: 'gemini_api_key',
  
  // Rate limiting
  API_RATE_LIMIT_PER_MINUTE: 15, // Free tier limit
  API_RETRY_DELAY_MS: 2000,
  MAX_API_RETRIES: 3,
  
  // Supported retailers
  SUPPORTED_RETAILERS: [
    {
      name: 'Amazon',
      domain: 'amazon.com',
      selectors: {
        title: '#productTitle, #title',
        price: '.a-price-whole, #priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen',
        image: '#landingImage, #imgTagWrapperId img, #ebooksImgBlkFront',
        asin: '[data-asin]'
      }
    },
    {
      name: 'eBay',
      domain: 'ebay.com',
      selectors: {
        title: '.x-item-title__mainTitle, h1.it-ttl',
        price: '.x-price-primary, #prcIsum, .display-price',
        image: '.ux-image-carousel-item img, #icImg',
        itemId: '[data-itemid]'
      }
    },
    {
      name: 'Walmart',
      domain: 'walmart.com',
      selectors: {
        title: 'h1[itemprop="name"], h1.prod-ProductTitle',
        price: '[itemprop="price"], .price-characteristic',
        image: '.prod-hero-image img, [data-testid="hero-image-container"] img',
        productId: '[data-product-id]'
      }
    },
    {
      name: 'Target',
      domain: 'target.com',
      selectors: {
        title: 'h1[data-test="product-title"]',
        price: '[data-test="product-price"]',
        image: 'img[data-test="image-gallery-item"]',
        tcin: '[data-test="product-tcin"]'
      }
    },
    {
      name: 'Best Buy',
      domain: 'bestbuy.com',
      selectors: {
        title: '.sku-title h1, h1.heading-5',
        price: '.priceView-customer-price span, [data-testid="customer-price"]',
        image: '.primary-image, .carousel-main-image',
        sku: '.sku-value'
      }
    },
    {
      name: 'AliExpress',
      domain: 'aliexpress.com',
      selectors: {
        title: '.product-title-text, h1',
        price: '.product-price-value, .uniform-banner-box-price',
        image: '.magnifier-image, .product-image img',
        productId: '[data-product-id]'
      }
    }
  ],
  
  // Storage keys
  STORAGE_KEYS: {
    USER_PREFERENCES: 'user_preferences',
    TRACKED_PRODUCTS: 'tracked_products',
    PRICE_HISTORY: 'price_history',
    DETECTED_PRODUCT: 'detected_product',
    THEME: 'theme'
  },
  
  // Default user preferences
  DEFAULT_PREFERENCES: {
    preferredRetailers: ['Amazon', 'Walmart', 'Target'],
    maxPrice: null,
    minPrice: null,
    notificationsEnabled: true,
    priceDropThreshold: 10, // percentage
    theme: 'light'
  },
  
  // Price check interval (in minutes)
  PRICE_CHECK_INTERVAL: 60
};

/**
 * Get API key from storage
 */
export async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get([CONFIG.GEMINI_API_KEY_STORAGE_KEY], (result) => {
      resolve(result[CONFIG.GEMINI_API_KEY_STORAGE_KEY] || null);
    });
  });
}

/**
 * Save API key to storage
 */
export async function saveApiKey(apiKey) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [CONFIG.GEMINI_API_KEY_STORAGE_KEY]: apiKey }, () => {
      resolve();
    });
  });
}
