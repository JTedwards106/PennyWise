/**
 * Content Script
 * Runs on shopping sites to detect and extract product information
 */

import { CONFIG } from '../config/config.js';

// Track if we've already detected a product on this page
let productDetected = false;

/**
 * Get the current retailer based on URL
 */
function getCurrentRetailer() {
  const hostname = window.location.hostname;
  return CONFIG.SUPPORTED_RETAILERS.find(retailer => 
    hostname.includes(retailer.domain)
  );
}

/**
 * Extract text content from element
 */
function getTextContent(selector) {
  const element = document.querySelector(selector);
  return element ? element.textContent.trim() : null;
}

/**
 * Extract price from text and normalize it
 */
function extractPrice(priceText) {
  if (!priceText) return null;
  
  // Remove currency symbols and extract numbers
  const match = priceText.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return null;
}

/**
 * Extract image URL from element
 */
function getImageUrl(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;
  
  // Handle different image loading strategies
  return element.src || element.dataset.src || element.dataset.lazySrc || null;
}

/**
 * Extract product ID from various sources
 */
function getProductId(retailer) {
  const selectors = retailer.selectors;
  
  // Try to get ID from specific selector
  for (const key in selectors) {
    if (key.includes('Id') || key.includes('asin') || key.includes('sku') || key.includes('tcin')) {
      const element = document.querySelector(selectors[key]);
      if (element) {
        return element.dataset.asin || 
               element.dataset.itemid || 
               element.dataset.productId || 
               element.dataset.sku ||
               element.textContent.trim();
      }
    }
  }
  
  // Fallback: extract from URL
  const urlMatch = window.location.href.match(/\/([A-Z0-9]{10})|item\/(\d+)|product\/(\d+)/);
  return urlMatch ? (urlMatch[1] || urlMatch[2] || urlMatch[3]) : null;
}

/**
 * Extract product information from the page
 */
function extractProductInfo() {
  const retailer = getCurrentRetailer();
  if (!retailer) {
    console.log('PennyWise: Not on a supported retailer site');
    return null;
  }

  // Try multiple selectors for each field
  const titleSelectors = retailer.selectors.title.split(',').map(s => s.trim());
  const priceSelectors = retailer.selectors.price.split(',').map(s => s.trim());
  const imageSelectors = retailer.selectors.image.split(',').map(s => s.trim());

  let title = null;
  let priceText = null;
  let imageUrl = null;

  // Find title
  for (const selector of titleSelectors) {
    title = getTextContent(selector);
    if (title) break;
  }

  // Find price
  for (const selector of priceSelectors) {
    priceText = getTextContent(selector);
    if (priceText) break;
  }

  // Find image
  for (const selector of imageSelectors) {
    imageUrl = getImageUrl(selector);
    if (imageUrl) break;
  }

  if (!title || !priceText) {
    console.log('PennyWise: Could not extract required product information');
    return null;
  }

  const price = extractPrice(priceText);
  if (!price) {
    console.log('PennyWise: Could not parse price');
    return null;
  }

  const productId = getProductId(retailer);

  const productInfo = {
    title,
    price,
    priceText,
    imageUrl,
    productId,
    retailer: retailer.name,
    url: window.location.href,
    detectedAt: new Date().toISOString()
  };

  console.log('PennyWise: Product detected', productInfo);
  return productInfo;
}

/**
 * Send product information to background script
 */
function sendProductInfo(productInfo) {
  chrome.runtime.sendMessage({
    type: 'PRODUCT_DETECTED',
    data: productInfo
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('PennyWise: Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('PennyWise: Product info sent to background');
    }
  });
}

/**
 * Check if we're on a product page
 */
function isProductPage() {
  const retailer = getCurrentRetailer();
  if (!retailer) return false;

  // Check URL patterns that typically indicate product pages
  const url = window.location.href;
  const productPagePatterns = [
    /\/dp\//,           // Amazon
    /\/itm\//,          // eBay
    /\/ip\//,           // Walmart
    /\/p\//,            // Target, Best Buy
    /\/item\//,         // AliExpress
    /product/i
  ];

  return productPagePatterns.some(pattern => pattern.test(url));
}

/**
 * Main detection function
 */
function detectProduct() {
  if (productDetected) return;
  if (!isProductPage()) return;

  const productInfo = extractProductInfo();
  if (productInfo) {
    productDetected = true;
    sendProductInfo(productInfo);
    
    // Update badge to show detection
    chrome.runtime.sendMessage({
      type: 'UPDATE_BADGE',
      data: { text: '1', color: '#22c55e' }
    });
  }
}

/**
 * Listen for messages from popup or background
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PRODUCT_INFO') {
    const productInfo = extractProductInfo();
    sendResponse({ productInfo });
  }
  return true;
});

/**
 * Initialize detection
 */
function init() {
  // Try to detect immediately
  detectProduct();

  // Try again after page is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(detectProduct, 1000);
    });
  } else {
    setTimeout(detectProduct, 1000);
  }

  // Watch for dynamic content changes (SPAs)
  const observer = new MutationObserver((mutations) => {
    if (!productDetected) {
      detectProduct();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Stop observing after 10 seconds to save resources
  setTimeout(() => observer.disconnect(), 10000);
}

// Start detection
init();
