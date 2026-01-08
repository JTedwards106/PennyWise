# Implementation Notes

## Architecture Overview

### Components

**1. Content Script** (`src/content/content-script.js`)
- Runs on supported retailer sites
- Detects product pages using URL patterns
- Extracts product information (title, price, image, ID)
- Communicates with background script via Chrome messaging API
- Uses MutationObserver to detect dynamically loaded content

**2. Background Service Worker** (`src/background/service-worker.js`)
- Persistent background process (Manifest V3)
- Handles API calls to Gemini
- Manages Chrome Storage operations
- Implements price checking alarms
- Sends browser notifications
- Acts as message hub between content script and popup

**3. Popup UI** (`src/popup/`)
- React-based user interface
- Shows detected product information
- Displays price comparisons across retailers
- Shows AI-powered recommendations
- Provides product tracking functionality
- Responsive design with dark/light mode

**4. Options Page** (`src/options/`)
- Settings and configuration interface
- API key management
- User preferences (retailers, price ranges, notifications)
- Tracked products management
- Three-tab layout (General, API, Tracked Products)

**5. Gemini Service** (`src/services/gemini-service.js`)
- Abstracts Gemini API interactions
- Implements rate limiting (15 req/min)
- Automatic retry logic with exponential backoff
- Generates search queries for product matching
- Provides personalized shopping recommendations
- Fallback to basic string matching if API fails

### Data Flow

```
Product Page → Content Script → Background Worker → Gemini API
                     ↓                    ↓              ↓
                Chrome Storage ← Popup UI ← Price Data
                                           ↓
                                    User Interface
```

## Key Features Implementation

### 1. Product Detection

**How it works:**
- Content script runs on supported domains
- Checks URL patterns (e.g., `/dp/` for Amazon)
- Uses CSS selectors to extract product data
- Multiple selector fallbacks for reliability

**Retailers Supported:**
- Amazon: ASIN-based detection
- eBay: Item ID extraction
- Walmart: Product ID from data attributes
- Target: TCIN number
- Best Buy: SKU detection
- AliExpress: Product ID from URL

**Selectors Strategy:**
- Multiple selectors per field (comma-separated)
- Try each selector until one succeeds
- Extract text content and normalize prices
- Handle different image loading strategies (lazy load, data-src)

### 2. Price Comparison

**Current Implementation:**
- Mock data generation for demonstration
- Realistic price variations (±15%)
- Random discounts and availability
- Sorted by lowest price

**Production Recommendation:**
- Integrate with retailer APIs (if available)
- Implement web scraping service (separate backend)
- Use affiliate networks (Amazon Associates, etc.)
- Cache results to minimize API calls

### 3. AI Recommendations

**Gemini Integration:**
- Temperature: 0.2 (more focused responses)
- Max tokens: 1024
- Structured prompts for consistent output
- JSON response parsing

**Recommendation Types:**
1. Which retailers to check first
2. Optimal timing for purchase
3. General shopping tips

**Error Handling:**
- Fallback to generic recommendations
- Rate limit management
- Retry logic for network errors

### 4. Price Tracking

**Storage Structure:**
```json
{
  "tracked_products": [
    {
      "title": "Product Name",
      "price": 29.99,
      "retailer": "Amazon",
      "url": "https://...",
      "productId": "B08...",
      "imageUrl": "https://...",
      "trackedAt": "2026-01-08T12:00:00Z",
      "lastChecked": "2026-01-08T12:00:00Z",
      "priceHistory": [
        {"price": 29.99, "date": "2026-01-08T12:00:00Z"}
      ]
    }
  ]
}
```

**Price Check Mechanism:**
- Chrome Alarms API (hourly checks)
- Compares current vs tracked price
- Sends notification if drop exceeds threshold
- Updates price history (keeps 30 days)

### 5. Notifications

**Implementation:**
- Chrome Notifications API
- Browser-native notifications
- Triggers on:
  - Product successfully tracked
  - Price drops below threshold
  - (Future) Back in stock alerts

**User Preferences:**
- Enable/disable toggle
- Configurable drop threshold (%)
- Quiet hours (future enhancement)

## Technical Decisions

### Why Manifest V3?
- Required for new Chrome extensions
- Better security model
- Service workers instead of background pages
- Improved performance

### Why React?
- Component-based architecture
- Easy state management
- Large ecosystem and community
- Fast development with hooks

### Why Tailwind CSS?
- Utility-first approach
- No CSS file bloat
- Easy dark mode implementation
- Responsive design built-in
- Good integration with build tools

### Why Gemini API?
- Free tier available
- Good for product matching
- Natural language processing
- Easy integration
- No complex authentication

## Limitations & Future Enhancements

### Current Limitations

1. **Mock Price Data**
   - Not real-time prices
   - For demonstration only
   - Needs real API integration

2. **Limited Retailers**
   - Only 6 retailers supported
   - Selectors may break with website updates
   - No international sites

3. **Basic Product Matching**
   - Relies on AI for matching
   - No UPC/EAN database
   - May match wrong products

4. **Rate Limits**
   - Free Gemini tier: 15 req/min
   - Can slow down in heavy usage
   - Need paid tier for production

### Recommended Enhancements

1. **Real-Time Pricing**
   - Integrate Rainforest API (Amazon)
   - Use eBay Finding API
   - Implement web scraping microservice
   - Add affiliate links for monetization

2. **Better Product Matching**
   - UPC/EAN database integration
   - Image-based product recognition
   - Brand and model number parsing
   - Category-specific matching

3. **Price History Charts**
   - Chart.js integration (already imported)
   - Historical price graphs
   - Trend analysis
   - Price prediction ML model

4. **Enhanced Tracking**
   - Back-in-stock alerts
   - Price prediction
   - Historical low notifications
   - Wishlist with price targets

5. **Social Features**
   - Share deals with friends
   - Deal forums/community
   - User reviews aggregation
   - Collaborative price tracking

6. **Additional Retailers**
   - International Amazon sites
   - Newegg, Costco, Sam's Club
   - Category-specific retailers
   - Local stores integration

7. **Browser History Analysis**
   - Personalized recommendations
   - Frequently viewed products
   - Shopping patterns
   - Budget tracking

8. **Coupon Integration**
   - Automatic coupon finding
   - Cashback offers
   - Browser extension partnerships
   - Credit card rewards tracking

## Security Considerations

### Data Privacy
- All data stored locally (Chrome Storage)
- No external database
- No user tracking
- No analytics

### API Key Security
- Stored in chrome.storage.local (encrypted by Chrome)
- Never transmitted except to Gemini API
- Not included in version control
- User enters their own key

### Permissions Justification
- `storage`: Save preferences and tracked products
- `notifications`: Price drop alerts
- `alarms`: Scheduled price checks
- `activeTab`: Inject content script
- `scripting`: Product detection
- Host permissions: Only supported retailers

## Testing Strategy

### Manual Testing
1. Visit each supported retailer
2. Navigate to product pages
3. Verify detection works
4. Check popup displays correctly
5. Test tracking functionality
6. Trigger notifications

### Edge Cases
- Products with no images
- Prices in different formats ($X.XX, $X, X.XX)
- Out of stock products
- Dynamic pricing
- Bundle deals

### Error Scenarios
- Invalid API key
- Rate limit exceeded
- Network failures
- Unsupported pages
- Missing selectors

## Performance Optimization

### Content Script
- Runs only on product pages
- Stops MutationObserver after 10s
- Single detection per page load
- Minimal DOM queries

### Background Service Worker
- Efficient message handling
- Batched storage operations
- Rate limiting to prevent API abuse
- Cleanup of old price history

### Popup
- Lazy loading of data
- Memoized components (future)
- Optimized re-renders
- Fast initial load

## Deployment Checklist

- [ ] Build production bundle (`npm run build`)
- [ ] Test on all supported retailers
- [ ] Verify API key handling
- [ ] Check icon sizes and quality
- [ ] Test notifications
- [ ] Review permissions
- [ ] Add privacy policy
- [ ] Create promotional images
- [ ] Write Chrome Web Store description
- [ ] Set up analytics (optional)
- [ ] Test on different screen sizes
- [ ] Verify dark mode
- [ ] Check for console errors
- [ ] Test extension updates

## Code Style Guidelines

### JavaScript/React
- Use functional components with hooks
- Prefer const over let
- Use async/await over promises
- Comment complex logic
- Extract reusable functions
- Handle all error cases

### CSS/Tailwind
- Use Tailwind utilities first
- Custom CSS only when necessary
- Mobile-first responsive design
- Dark mode support via `dark:` prefix

### File Organization
- One component per file
- Co-locate related files
- Clear naming conventions
- Separate concerns (UI, logic, data)

## Useful Resources

### Documentation
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [React Docs](https://react.dev/)
- [Tailwind Docs](https://tailwindcss.com/docs)

### Tools
- [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid)
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### APIs & Services
- [Google AI Studio](https://makersuite.google.com/)
- [Rainforest API](https://www.rainforestapi.com/) - Amazon data
- [eBay Finding API](https://developer.ebay.com/DevZone/finding/Concepts/FindingAPIGuide.html)
- [Affiliate APIs](https://www.amazon.com/associates/)

## Support & Contribution

This is a complete, production-ready foundation for a shopping assistant extension. Feel free to:
- Extend functionality
- Add more retailers
- Improve product matching
- Integrate real pricing APIs
- Contribute back improvements

Happy coding! 🚀
