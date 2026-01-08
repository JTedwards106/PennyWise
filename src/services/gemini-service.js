/**
 * Gemini API Service
 * Handles all interactions with Google's Gemini AI API
 */

import { CONFIG, getApiKey } from '../config/config.js';

class GeminiService {
  constructor() {
    this.requestQueue = [];
    this.lastRequestTime = 0;
    this.requestCount = 0;
  }

  /**
   * Rate limiting: Ensure we don't exceed API limits
   */
  async rateLimit() {
    const now = Date.now();
    const oneMinute = 60000;
    
    // Reset counter if a minute has passed
    if (now - this.lastRequestTime > oneMinute) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    // Wait if we've hit the rate limit
    if (this.requestCount >= CONFIG.API_RATE_LIMIT_PER_MINUTE) {
      const waitTime = oneMinute - (now - this.lastRequestTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }
    
    this.requestCount++;
  }

  /**
   * Make a request to Gemini API with retry logic
   */
  async makeRequest(prompt, retries = 0) {
    try {
      await this.rateLimit();
      
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('API key not configured. Please add your Gemini API key in the settings.');
      }

      const response = await fetch(`${CONFIG.GEMINI_API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limiting
        if (response.status === 429 && retries < CONFIG.MAX_API_RETRIES) {
          console.log(`Rate limited, retrying in ${CONFIG.API_RETRY_DELAY_MS}ms...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.API_RETRY_DELAY_MS));
          return this.makeRequest(prompt, retries + 1);
        }
        
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Retry on network errors
      if (retries < CONFIG.MAX_API_RETRIES && error.message.includes('fetch')) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.API_RETRY_DELAY_MS));
        return this.makeRequest(prompt, retries + 1);
      }
      
      throw error;
    }
  }

  /**
   * Generate search queries for finding the same product on other sites
   */
  async generateSearchQueries(productInfo) {
    const prompt = `Given this product information:
Title: ${productInfo.title}
Current Store: ${productInfo.retailer}
Price: ${productInfo.price}

Generate 2-3 effective search queries to find this exact product on other shopping websites.
The queries should be concise and focus on the most distinctive product features.
Return the result as a JSON array of strings, e.g., ["query1", "query2", "query3"]
Only return the JSON array, nothing else.`;

    try {
      const response = await this.makeRequest(prompt);
      // Parse the JSON response
      const cleanedResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating search queries:', error);
      // Fallback: generate basic search query
      return [productInfo.title.substring(0, 100)];
    }
  }

  /**
   * Match products to determine if they are the same item
   */
  async matchProducts(sourceProduct, targetProduct) {
    const prompt = `Compare these two products and determine if they are the same item:

Product 1:
Title: ${sourceProduct.title}
Price: ${sourceProduct.price}

Product 2:
Title: ${targetProduct.title}
Price: ${targetProduct.price}

Are these the same product? Consider:
- Product name and key features
- Brand (if mentioned)
- Product type and category
- Allow for different sellers, conditions, or bundles

Respond with ONLY "YES" or "NO".`;

    try {
      const response = await this.makeRequest(prompt);
      return response.trim().toUpperCase().includes('YES');
    } catch (error) {
      console.error('Error matching products:', error);
      // Fallback: basic string matching
      const similarity = this.calculateSimilarity(
        sourceProduct.title.toLowerCase(),
        targetProduct.title.toLowerCase()
      );
      return similarity > 0.6;
    }
  }

  /**
   * Get personalized recommendations based on user preferences
   */
  async getRecommendations(productInfo, userPreferences) {
    const prompt = `Based on this product and user preferences, provide shopping recommendations:

Product: ${productInfo.title}
Price: ${productInfo.price}
User's preferred retailers: ${userPreferences.preferredRetailers.join(', ')}
Budget range: ${userPreferences.minPrice || 'No min'} - ${userPreferences.maxPrice || 'No max'}

Provide 3 brief recommendations for finding the best deal:
1. Which retailers to check first
2. What time to buy (if timing matters)
3. Any relevant shopping tips

Keep each recommendation to one sentence. Return as JSON array of strings.
Only return the JSON array, nothing else.`;

    try {
      const response = await this.makeRequest(prompt);
      const cleanedResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [
        'Compare prices across your preferred retailers.',
        'Check for available coupons and cashback offers.',
        'Consider waiting for seasonal sales if not urgent.'
      ];
    }
  }

  /**
   * Simple string similarity calculation (Levenshtein distance based)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
