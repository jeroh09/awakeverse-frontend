// src/services/providers/StripeProvider.js
/**
 * StripeProvider - Stripe payment integration
 * 
 * Handles all Stripe-specific payment processing including:
 * - Checkout session creation
 * - Session status checks
 * - Health monitoring
 */

/**
 * Base provider interface
 * All providers must implement these methods
 */
class BaseProvider {
  constructor({ config, envConfig }) {
    this.config = config;
    this.envConfig = envConfig;
  }
  
  async createCheckoutSession(options) {
    throw new Error('createCheckoutSession must be implemented');
  }
  
  async isAvailable() {
    throw new Error('isAvailable must be implemented');
  }
  
  async healthCheck() {
    throw new Error('healthCheck must be implemented');
  }
}

/**
 * StripeProvider - Stripe integration implementation
 */
class StripeProvider extends BaseProvider {
  constructor({ config, envConfig }) {
    super({ config, envConfig });
  }
  
  /**
   * Get API base URL
   */
  getApiBase() {
    return this.envConfig.getApiBase();
  }
  
    /**
   * Create Stripe checkout session
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
      const endpoint = `${apiBase}${this.config.endpoints.createSession}`;
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
        console.log('[StripeProvider] Creating checkout session', {
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
      if (!data.checkout_url) {
        return this._error('Invalid response from server: missing checkout_url', true);
      }
      
      // Log success
      if (this.envConfig.detectEnvironment() === 'development') {
        console.log('[StripeProvider] Session created successfully', {
          sessionId: data.session_id,
          url: data.checkout_url
        });
      }
      
      return {
        success: true,
        checkoutUrl: data.checkout_url,
        sessionId: data.session_id,
        tierDisplay: data.tier_display,
        currency: data.currency
      };
      
    } catch (error) {
      // DEFENSIVE: Network or unexpected errors
      console.error('[StripeProvider] Unexpected error:', error);
      
      return this._error(
        error.message || 'Network error occurred',
        true, // Retryable
        { originalError: error.message }
      );
    }
  }

    /**
   * Check Stripe session status
   * 
   * @param {string} sessionId - Stripe session ID
   * @returns {Promise<Object>} Session status
   */
  async getSessionStatus(sessionId) {
    try {
      if (!sessionId) {
        return this._error('Session ID required', false);
      }
      
      const apiBase = this.getApiBase();
      const endpoint = `${apiBase}${this.config.endpoints.sessionStatus}/${sessionId}`;
      
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
        status: data.payment_status,
        completed: data.completed,
        tierName: data.tier_name,
        subscriptionId: data.subscription_id
      };
      
    } catch (error) {
      console.error('[StripeProvider] Session status error:', error);
      return this._error(error.message, true);
    }
  }
  
  /**
   * Check if Stripe provider is available
   * 
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch (error) {
      console.error('[StripeProvider] Availability check failed:', error);
      return false;
    }
  }
  
  /**
   * Perform health check on Stripe integration
   * 
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const apiBase = this.getApiBase();
      const endpoint = `${apiBase}${this.config.endpoints.health}`;
      
      // DEFENSIVE: Health check should work without auth
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return {
          status: 'unhealthy',
          provider: 'stripe',
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        };
      }
      
      const data = await response.json();
      
      return {
        status: data.status || 'healthy',
        provider: 'stripe',
        stripeConfigured: data.stripe_configured,
        stripeAccessible: data.stripe_api_accessible,
        availableTiers: data.available_tiers,
        supportedCurrencies: data.supported_currencies,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[StripeProvider] Health check failed:', error);
      
      return {
        status: 'error',
        provider: 'stripe',
        error: error.message,
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
      
      return this._error(userMessage, retryable, {
        statusCode: response.status,
        errorType: errorData.error_type,
        serverMessage: errorData.error
      });
      
    } catch (parseError) {
      // Couldn't parse error response
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
        provider: 'stripe',
        message: message,
        userMessage: this._getUserFriendlyMessage(message),
        retryable: retryable,
        details: details,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Convert technical error to user-friendly message
   */
  _getUserFriendlyMessage(technicalMessage) {
    const lowerMsg = technicalMessage.toLowerCase();
    
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
    
    // Default fallback
    return 'Payment processing failed. Please try again or contact support.';
  }
}

export default StripeProvider;