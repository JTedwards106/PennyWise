# PennyWise - AI-Powered Shopping Assistant 🛍️

A Chrome Extension that helps you find the best deals by comparing prices across multiple retailers, finding discounts, and providing AI-powered shopping recommendations.

## Features

### Core Functionality
- **Automatic Product Detection**: Detects products when you visit shopping sites (Amazon, eBay, Walmart, Target, Best Buy, AliExpress)
- **Price Comparison**: Compare prices across multiple retailers for the same product
- **AI-Powered Recommendations**: Get smart shopping advice from Google Gemini AI
- **Price Tracking**: Monitor products and get notified when prices drop
- **Discount Finder**: Shows available coupons and deals
- **Price History**: Track price trends over time
- **Dark Mode**: Beautiful dark/light theme toggle

### Supported Retailers
- Amazon
- eBay
- Walmart
- Target
- Best Buy
- AliExpress

## Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Build Tools**: Webpack, Babel
- **AI**: Google Gemini API (free tier)
- **Extension**: Chrome Manifest V3
- **Storage**: Chrome Storage API

## Project Structure

```
PennyWise/
├── public/
│   ├── manifest.json          # Extension configuration
│   ├── popup.html             # Popup interface HTML
│   ├── options.html           # Settings page HTML
│   └── icons/                 # Extension icons (16x16, 32x32, 48x48, 128x128)
├── src/
│   ├── background/
│   │   └── service-worker.js  # Background tasks, API calls, notifications
│   ├── config/
│   │   └── config.js          # Configuration and constants
│   ├── content/
│   │   └── content-script.js  # Product detection on shopping sites
│   ├── popup/
│   │   ├── index.jsx          # Popup entry point
│   │   └── Popup.jsx          # Main popup React component
│   ├── options/
│   │   ├── options.jsx        # Options page entry point
│   │   └── Options.jsx        # Settings React component
│   ├── services/
│   │   └── gemini-service.js  # Gemini API integration
│   └── styles/
│       └── input.css          # Tailwind CSS input
├── dist/                      # Built extension files (generated)
├── package.json
├── webpack.config.js
├── tailwind.config.js
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Chrome browser
- Google Gemini API key (free)

### Step 1: Install Dependencies

```powershell
npm install
```

### Step 2: Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the API key (keep it safe!)

**Note**: The free tier allows 15 requests per minute, which is sufficient for normal usage.

### Step 3: Create Extension Icons

Create four icon files in the `public/icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can use any image editor or online tool to create these.

### Step 4: Build the Extension

```powershell
# For development (with watch mode)
npm run dev

# For production build
npm run build
```

This will create a `dist/` folder with the compiled extension.

### Step 5: Build Tailwind CSS

In a separate terminal, run:

```powershell
npm run tailwind:build
```

This watches for CSS changes and rebuilds the stylesheet.

### Step 6: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from your project
5. The PennyWise extension should now appear in your extensions list

### Step 7: Configure API Key

1. Click the PennyWise extension icon in Chrome
2. Click the **⚙️ Settings** button
3. Go to the **"API Configuration"** tab
4. Paste your Gemini API key
5. Click **"Save Settings"**

## Usage Guide

### Detecting Products

1. Visit any supported retailer's product page (e.g., Amazon product page)
2. The extension will automatically detect the product
3. A green checkmark badge will appear on the extension icon
4. Click the extension icon to see price comparisons

### Comparing Prices

1. Click the extension icon when viewing a product
2. View the **"Price Comparison"** tab to see prices from other retailers
3. Click **"View on [Retailer]"** to visit that retailer's site
4. See discounts, shipping info, and availability

### Getting AI Recommendations

1. In the extension popup, click the **"Recommendations"** tab
2. View personalized shopping tips from Gemini AI
3. Get advice on when to buy, where to shop, and money-saving tips

### Tracking Products

1. When viewing a product, click **"📊 Track Price"**
2. The product will be added to your watchlist
3. You'll receive browser notifications when the price drops
4. View all tracked products in Settings → "Tracked Products" tab

### Adjusting Settings

**Preferred Retailers**: Choose which retailers to compare prices with

**Price Range**: Set minimum/maximum price filters

**Notifications**: 
- Toggle price drop notifications on/off
- Set the price drop threshold percentage (default: 10%)

**Theme**: Switch between light and dark mode

## Troubleshooting

### Extension Not Detecting Products

- Make sure you're on a product page (not search results or homepage)
- Refresh the page after installing the extension
- Check that the retailer is supported
- Open DevTools (F12) and check the Console for errors

### API Errors

**"API key not configured"**
- Go to Settings and add your Gemini API key

**"Rate limited"**
- You've exceeded the free tier limit (15 requests/minute)
- Wait a few minutes and try again
- The extension automatically retries failed requests

**"API request failed"**
- Check your internet connection
- Verify your API key is valid
- Make sure the Gemini API is not experiencing outages

### Price Comparisons Not Showing

- The free implementation uses mock data for demonstration
- In production, you would integrate with actual retailer APIs or web scraping services
- The AI still provides real recommendations based on detected products

### Icons Not Showing

- Make sure you've created all four icon sizes in `public/icons/`
- Rebuild the extension: `npm run build`
- Reload the extension in `chrome://extensions/`

## Development

### Development Mode

```powershell
# Terminal 1: Build JavaScript
npm run dev

# Terminal 2: Build CSS
npm run tailwind:build
```

After making changes:
1. Save your files
2. Go to `chrome://extensions/`
3. Click the reload icon on PennyWise
4. Test your changes

## License

MIT License

## Credits

Built with React, Tailwind CSS, Google Gemini AI, and Webpack.

---

**Happy Shopping! 🎉**
