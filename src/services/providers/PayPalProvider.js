// src/services/providers/PayPalProvider.js
/**
 * PayPalProvider - PayPal payment integration
 * 
 * Handles all PayPal-specific payment processing including:
 * - Order creation
 * - Order status checks
 * - Health monitoring
 * 
 * NOTE: Backend endpoints are not yet implemented.
 * This provider is ready to use once backend routes are available.
 */

/**
 * PayPalProvider - PayPal payment integration
 */

class PayPalProvider {
  constructor({ config, envConfig }) {
    this.config = config;
    this.envConfig = envConfig;
  }

  getApiBase() {
    return this.envConfig.getApiBase();
  }
  
    /**
   * Create PayPal checkout order
   * 
   * @param {Object} options
   * @param {string} options.tier - Subscription tier
   * @param {string} options.currency - Currency code
   * @param {string} options.triggerSource - Analytics source
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} Result with checkoutUrl or error
   */
  async createCheckoutSession(options) {
    const { tier, currency, triggerSource, metadata } = options;
    
    try {
      // DEFENSIVE: Validate inputs
      if (!tier) {
        return this._error('Tier is required', false);
      }
      
      // Build request
      const apiBase = this.getApiBase();
      const endpoint = `${apiBase}${this.config.endpoints.createOrder}`;
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || '';
      
      const requestBody = {
        tier_name: tier,
        currency: currency || this.config.defaultCurrency
      };
      
      // Add optional metadata
      if (triggerSource) {
        requestBody.metadata = {
          ...metadata,
          trigger_source: triggerSource
        };
      } else if (metadata) {
        requestBody.metadata = metadata;
      }
      
      // Log request in development
      if (this.envConfig.detectEnvironment() === 'development') {
        console.log('[PayPalProvider] Creating checkout order', {
          endpoint,
          body: requestBody
        });
      }
      
      // Make API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      
      // DEFENSIVE: Handle HTTP errors
      if (!response.ok) {
        return await this._handleErrorResponse(response);
      }
      
      // Parse success response
      const data = await response.json();
      
      // DEFENSIVE: Validate response structure
      if (!data.checkout_url && !data.approval_url) {
        return this._error('Invalid response from server: missing checkout URL', true);
      }
      
      // PayPal returns 'approval_url' instead of 'checkout_url'
      const checkoutUrl = data.checkout_url || data.approval_url;
      
      // Log success
      if (this.envConfig.detectEnvironment() === 'development') {
        console.log('[PayPalProvider] Order created successfully', {
          orderId: data.order_id,
          url: checkoutUrl
        });
      }
      
      return {
        success: true,
        checkoutUrl: checkoutUrl,
        sessionId: data.order_id, // PayPal uses order_id
        tierDisplay: data.tier_display,
        currency: data.currency
      };
      
    } catch (error) {
      // DEFENSIVE: Network or unexpected errors
      console.error('[PayPalProvider] Unexpected error:', error);
      
      // Check if backend is not implemented yet
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return this._error(
          'PayPal integration is not yet available. Please use Stripe.',
          false,
          { backendNotReady: true }
        );
      }
      
      return this._error(
        error.message || 'Network error occurred',
        true, // Retryable
        { originalError: error.message }
      );
    }
  }
  
  /**
   * Check PayPal order status
   * 
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Order status
   */
  async getOrderStatus(orderId) {
    try {
      if (!orderId) {
        return this._error('Order ID required', false);
      }
      
      const apiBase = this.getApiBase();
      const endpoint = `${apiBase}${this.config.endpoints.orderStatus}/${orderId}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        return await this._handleErrorResponse(response);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        status: data.status,
        completed: data.status === 'COMPLETED',
        tierName: data.tier_name,
        subscriptionId: data.subscription_id
      };
      
    } catch (error) {
      console.error('[PayPalProvider] Order status error:', error);
      
      if (error.message.includes('404')) {
        return this._error(
          'PayPal integration is not yet available.',
          false,
          { backendNotReady: true }
        );
      }
      
      return this._error(error.message, true);
    }
  }
  
  /**
   * Check if PayPal provider is available
   * 
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch (error) {
      console.error('[PayPalProvider] Availability check failed:', error);
      return false;
    }
  }
  
  /**
   * Perform health check on PayPal integration
   * 
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const apiBase = this.getApiBase();
      const endpoint = `${apiBase}${this.config.endpoints.health}`;
      
      // DEFENSIVE: If health endpoint is not configured, assume not ready
      if (!endpoint || endpoint.includes('null')) {
        return {
          status: 'not_implemented',
          provider: 'paypal',
          message: 'PayPal integration not yet implemented',
          backendReady: false,
          timestamp: new Date().toISOString()
        };
      }
      
      // Try to call health endpoint
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Backend not ready - 404 expected
      if (response.status === 404) {
        return {
          status: 'not_implemented',
          provider: 'paypal',
          message: 'PayPal backend routes not yet available',
          backendReady: false,
          timestamp: new Date().toISOString()
        };
      }
      
      if (!response.ok) {
        return {
          status: 'unhealthy',
          provider: 'paypal',
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        };
      }
      
      const data = await response.json();
      
      return {
        status: data.status || 'healthy',
        provider: 'paypal',
        paypalConfigured: data.paypal_configured,
        paypalAccessible: data.paypal_api_accessible,
        availableTiers: data.available_tiers,
        supportedCurrencies: data.supported_currencies,
        backendReady: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[PayPalProvider] Health check failed:', error);
      
      // Network error or endpoint doesn't exist
      return {
        status: 'not_implemented',
        provider: 'paypal',
        error: error.message,
        message: 'PayPal integration not yet available',
        backendReady: false,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  /**
   * Handle HTTP error responses
   */
  async _handleErrorResponse(response) {
    try {
      const errorData = await response.json();
      
      // Use server error message if available
      const userMessage = errorData.error || `Server error: ${response.status}`;
      const retryable = response.status >= 500; // 5xx errors are retryable
      
      // Special handling for 404 (not implemented)
      if (response.status === 404) {
        return this._error(
          'PayPal integration is not yet available. Please use Stripe.',
          false,
          {
            statusCode: 404,
            backendNotReady: true
          }
        );
      }
      
      return this._error(userMessage, retryable, {
        statusCode: response.status,
        errorType: errorData.error_type,
        serverMessage: errorData.error
      });
      
    } catch (parseError) {
      // Couldn't parse error response
      if (response.status === 404) {
        return this._error(
          'PayPal integration is not yet available.',
          false,
          { statusCode: 404, backendNotReady: true }
        );
      }
      
      return this._error(
        `Server error: ${response.status}`,
        response.status >= 500,
        { statusCode: response.status }
      );
    }
  }
  
  /**
   * Create standardized error response
   */
  _error(message, retryable = false, details = {}) {
    return {
      success: false,
      error: {
        provider: 'paypal',
        message: message,
        userMessage: this._getUserFriendlyMessage(message, details),
        retryable: retryable,
        details: details,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Convert technical error to user-friendly message
   */
  _getUserFriendlyMessage(technicalMessage, details = {}) {
    const lowerMsg = technicalMessage.toLowerCase();
    
    // Special case: backend not ready
    if (details.backendNotReady) {
      return 'PayPal payments are coming soon! Please use Stripe for now.';
    }
    
    // Map technical errors to user-friendly messages
    if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
      return 'Connection failed. Please check your internet and try again.';
    }
    
    if (lowerMsg.includes('unauthorized') || lowerMsg.includes('authentication')) {
      return 'Please sign in to continue.';
    }
    
    if (lowerMsg.includes('invalid') || lowerMsg.includes('missing')) {
      return 'Invalid request. Please try again.';
    }
    
    if (lowerMsg.includes('server') || lowerMsg.includes('500')) {
      return 'Service temporarily unavailable. Please try again in a moment.';
    }
    
    if (lowerMsg.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (lowerMsg.includes('not yet') || lowerMsg.includes('not implemented')) {
      return 'PayPal payments are coming soon! Please use Stripe for now.';
    }
    
    // Default fallback
    return 'Payment processing failed. Please try Stripe or contact support.';
  }
}

export default PayPalProvider;