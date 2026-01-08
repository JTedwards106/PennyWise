# Complete Setup Guide

## Prerequisites Checklist

- [ ] Node.js installed (v16+): Check with `node --version`
- [ ] npm installed: Check with `npm --version`
- [ ] Google Chrome browser
- [ ] Text editor (VS Code recommended)
- [ ] Internet connection

## Detailed Setup Steps

### 1. Install Node.js Dependencies

```powershell
npm install
```

This installs:
- React & React-DOM (UI framework)
- Webpack & Babel (build tools)
- Tailwind CSS (styling)
- Copy Webpack Plugin (asset management)

**Expected output**: "added X packages" message

### 2. Get Gemini API Key

#### Option A: Free Tier (Recommended for Development)
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Select "Create API key in new project"
5. Copy the key (starts with "AIza...")

#### Option B: Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "Generative Language API"
4. Create credentials → API Key
5. Copy the key

**Save this key** - you'll need it later!

**Rate Limits (Free Tier)**:
- 15 requests per minute
- 1,500 requests per day
- Perfect for development and testing

### 3. Create Extension Icons

You need 4 PNG files in `public/icons/`:

#### Option A: Use Online Generator (Easiest)
1. Visit https://www.favicon-generator.org/
2. Upload any shopping-related image (bag, cart, coin, etc.)
3. Download the generated favicons
4. Rename them to:
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`
5. Place in `public/icons/` directory

#### Option B: Create Manually
Use any image editor (Paint, Photoshop, GIMP, etc.) to create:
- 16x16 pixel PNG → `icon16.png`
- 32x32 pixel PNG → `icon32.png`
- 48x48 pixel PNG → `icon48.png`
- 128x128 pixel PNG → `icon128.png`

**Design Tips**:
- Use simple, recognizable symbols
- High contrast colors
- Avoid fine details (won't be visible at small sizes)
- Suggested symbols: 🛒 💰 💳 🏷️

#### Create Icons Directory

```powershell
mkdir public\icons
```

### 4. Build the Extension

#### First-Time Build

```powershell
# Build JavaScript
npm run build

# Build CSS
npx tailwindcss -i ./src/styles/input.css -o ./src/styles/output.css
```

**Expected output**:
- `dist/` folder created
- Files in dist: popup.html, options.html, manifest.json, popup.js, background.js, content.js, options.js

#### Verify Build

```powershell
ls dist
```

You should see:
- popup.html
- options.html
- manifest.json
- background.js
- content.js
- popup.js
- options.js
- icons/ folder
- styles/ folder

### 5. Load Extension in Chrome

#### Step-by-Step

1. **Open Chrome Extensions Page**
   - Type in address bar: `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Look for toggle switch in top-right corner
   - Click to enable (should turn blue/green)

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to your project folder
   - Select the `dist` folder (NOT the project root)
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "PennyWise - Shopping Assistant" card
   - Status should show as "Enabled"
   - Extension icon may appear in toolbar

5. **Pin to Toolbar** (Optional but Recommended)
   - Click puzzle piece icon in Chrome toolbar
   - Find PennyWise
   - Click pin icon

### 6. Configure Extension

#### Add API Key

1. Click PennyWise icon in Chrome toolbar
2. Click ⚙️ Settings button (or right-click icon → Options)
3. Go to "API Configuration" tab
4. Paste your Gemini API key
5. Click "Save Settings"
6. You should see "✓ Settings saved successfully!"

#### Configure Preferences (Optional)

**Preferred Retailers**:
- Check/uncheck retailers you want to compare
- Default: Amazon, Walmart, Target

**Notifications**:
- Enable/disable price drop alerts
- Set threshold (default: 10%)

### 7. Test the Extension

#### Test Product Detection

1. **Go to Amazon**: https://www.amazon.com/
2. **Search for any product** (e.g., "wireless headphones")
3. **Click on a product** to view details page
4. **Wait 2-3 seconds**
5. **Check extension icon** - should show green checkmark ✓
6. **Click extension icon** to see popup

#### What You Should See

- Product title and image
- Current price from Amazon
- "Price Comparison" tab with mock prices from other retailers
- "Recommendations" tab with AI-generated tips
- "Track Price" button

#### Troubleshooting Test

If product not detected:
1. Refresh the page
2. Check browser console (F12) for errors
3. Make sure you're on a product page (URL should have `/dp/` for Amazon)
4. Try a different product
5. Check that content script is running (Console → Filter "PennyWise")

### 8. Development Setup (Optional)

If you plan to modify the code:

```powershell
# Terminal 1: Watch JavaScript changes
npm run dev

# Terminal 2: Watch CSS changes
npm run tailwind:build
```

#### Development Workflow

1. Make code changes
2. Save files
3. Go to `chrome://extensions/`
4. Click reload button on PennyWise card
5. Refresh any open product pages
6. Test your changes

## Verification Checklist

After setup, verify:

- [ ] `node_modules/` folder exists
- [ ] `dist/` folder exists with built files
- [ ] Icons appear in `dist/icons/`
- [ ] Extension loads without errors in Chrome
- [ ] API key is saved in extension settings
- [ ] Product detection works on Amazon
- [ ] Popup shows when clicking extension icon
- [ ] Settings page opens (right-click icon → Options)

## Common Issues & Solutions

### Issue: "Cannot find module 'react'"
**Solution**: Run `npm install` again

### Issue: "dist folder is empty"
**Solution**: 
```powershell
npm run build
npx tailwindcss -i ./src/styles/input.css -o ./src/styles/output.css
```

### Issue: "Extension icons not showing"
**Solution**: 
1. Create icons in `public/icons/`
2. Run `npm run build` again
3. Reload extension in Chrome

### Issue: "Popup shows 'No product detected'"
**Solution**:
- You're not on a product page, or
- Content script hasn't loaded yet (refresh page), or
- Retailer not supported, or
- Selectors need updating for new website layout

### Issue: "API key not working"
**Solution**:
1. Verify key is correct (no extra spaces)
2. Check key hasn't exceeded rate limits
3. Ensure Gemini API is enabled in Google Cloud
4. Try generating a new key

### Issue: "CSS styling looks broken"
**Solution**:
```powershell
npx tailwindcss -i ./src/styles/input.css -o ./src/styles/output.css --watch
npm run build
```

## Next Steps

1. **Test on Multiple Sites**
   - Try eBay, Walmart, Target, Best Buy
   - Check which selectors work

2. **Track a Product**
   - Click "Track Price" button
   - Check Settings → Tracked Products

3. **Customize Settings**
   - Add/remove preferred retailers
   - Adjust notification threshold

4. **Review Code**
   - Check `src/` folder structure
   - Read inline comments
   - Understand data flow

5. **Plan Enhancements**
   - Real API integrations
   - Better product matching
   - Additional retailers
   - Price history charts

## Support

For issues:
1. Check console logs (F12 in Chrome)
2. Review README.md troubleshooting section
3. Verify all setup steps completed
4. Check code comments for implementation details

## Success!

If you can:
- ✓ See the extension in Chrome
- ✓ Detect a product on Amazon
- ✓ View price comparisons
- ✓ See AI recommendations

**You're all set! Happy shopping! 🎉**
