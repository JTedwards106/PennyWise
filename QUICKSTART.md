# PennyWise Quick Start Guide

## Fastest Way to Get Started (5 minutes)

### 1. Install Dependencies
```powershell
npm install
```

### 2. Get API Key
- Visit: https://makersuite.google.com/app/apikey
- Sign in and create an API key
- Save it for later

### 3. Create Icons (Temporary Simple Icons)

```powershell
# Create icons directory
mkdir public\icons

# For Windows, you can use any simple icon generator online
# Or create simple 16x16, 32x32, 48x48, 128x128 PNG files
# Temporary: Use any shopping-related icon or logo
```

**Quick Icon Tip**: Visit https://www.favicon-generator.org/ and upload any shopping bag image to generate all icon sizes at once.

### 4. Build the Extension

```powershell
# Terminal 1: Build JavaScript (run this first)
npm run build

# Terminal 2: Build CSS
npx tailwindcss -i ./src/styles/input.css -o ./src/styles/output.css
```

### 5. Load in Chrome

1. Open Chrome: `chrome://extensions/`
2. Toggle "Developer mode" ON (top right)
3. Click "Load unpacked"
4. Select the `dist` folder
5. Done! Extension is loaded

### 6. Configure API Key

1. Click the PennyWise icon
2. Click ⚙️ (Settings)
3. Go to "API Configuration" tab
4. Paste your API key
5. Click "Save Settings"

### 7. Test It

1. Go to any Amazon product page (e.g., https://www.amazon.com/dp/B08N5WRWNW)
2. Wait 2-3 seconds
3. Click the PennyWise extension icon
4. See price comparisons and recommendations!

## Common First-Time Issues

**"Cannot find module"**
- Run `npm install` again
- Make sure you're in the project directory

**"Icons not showing"**
- Create 4 PNG files in `public/icons/` (any simple icon works for testing)
- Names: icon16.png, icon32.png, icon48.png, icon128.png

**"Extension doesn't detect product"**
- Make sure you're on a product page, not search results
- Refresh the page after loading the extension
- Check browser console (F12) for errors

**"CSS not loading"**
- Run: `npx tailwindcss -i ./src/styles/input.css -o ./src/styles/output.css`
- Then rebuild: `npm run build`

## Development Workflow

```powershell
# Terminal 1: Watch JavaScript changes
npm run dev

# Terminal 2: Watch CSS changes
npm run tailwind:build
```

After any code change:
1. Save the file
2. Go to `chrome://extensions/`
3. Click reload icon on PennyWise
4. Refresh the product page you're testing on

## Need Help?

Check the full README.md for detailed documentation.
