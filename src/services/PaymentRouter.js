// src/services/PaymentRouter.js
/**
 * PaymentRouter - Centralized Payment Routing Service
 * 
 * Handles all payment redirects and checkout flows across the application.
 * Automatically detects environment and routes to correct payment providers.
 * 
 * @example
 * // Simple upgrade
 * await PaymentRouter.redirectToCheckout({ tier: 'pro' });
 * 
 * // With options
 * await PaymentRouter.redirectToCheckout({
 *   tier: 'unlimited',
 *   currency: 'GBP',
 *   triggerSource: 'creator_dashboard'
 * });
 */

import StripeProvider from './providers/StripeProvider';
import PayPalProvider from './providers/PayPalProvider';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Environment detection and configuration
 */
const ENV_CONFIG = {
  /**
   * Detect current environment from hostname and env variables
   */
  detectEnvironment() {
    // 1. Explicit env variable (highest priority)
    if (process.env.REACT_APP_ENVIRONMENT) {
      return process.env.REACT_APP_ENVIRONMENT;
    }
    
    // 2. Hostname detection
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('staging')) {
      return 'staging';
    }
    
    // 3. Default to production (safest)
    return 'production';
  },
  
  /**
   * Get API base URL for current environment
   */
  getApiBase() {
    // Manual override via env variable
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    const env = this.detectEnvironment();
    
    const apiBaseUrls = {
      development: 'http://localhost:5000',
      staging: 'https://staging-api.awakeverse.com',
      production: 'https://api.awakeverse.com'
    };
    
    return apiBaseUrls[env] || apiBaseUrls.production;
  },
  
  /**
   * Get frontend base URL for current environment
   */
  getFrontendBase() {
    // Manual override via env variable
    if (process.env.REACT_APP_FRONTEND_URL) {
      return process.env.REACT_APP_FRONTEND_URL;
    }
    
    const env = this.detectEnvironment();
    
    const frontendBaseUrls = {
      development: 'http://localhost:3000',
      staging: 'https://staging.awakeverse.com',
      production: 'https://awakeverse.com'
    };
    
    return frontendBaseUrls[env] || frontendBaseUrls.production;
  }
};

/**
 * Provider configuration
 */
const PROVIDER_CONFIG = {
  stripe: {
    name: 'Stripe',
    enabled: true,
    endpoints: {
      createSession: '/api/stripe/create-checkout-session',
      sessionStatus: '/api/stripe/session-status',
      health: '/api/stripe/health'
    },
    supportedCurrencies: ['GBP', 'USD', 'EUR'],
    defaultCurrency: 'GBP'
  },
  
  paypal: {
    name: 'PayPal',
    enabled: true, // Will be enabled when backend ready
    endpoints: {
      createOrder: '/api/paypal/create-order',
      orderStatus: '/api/paypal/order-status',
      health: '/api/paypal/health'
    },
    supportedCurrencies: ['GBP', 'USD', 'EUR'],
    defaultCurrency: 'GBP'
  }
};

/**
 * Tier configuration
 */
const TIER_CONFIG = {
  starter: {
    name: 'starter',
    displayName: 'EXPLORER',
    description: 'Start Your Journey',
    pricing: {
      GBP: { amount: 3.99, display: '£3.99' },
      USD: { amount: 4.99, display: '$4.99' },
      EUR: { amount: 4.99, display: '€4.99' }
    }
  },
  
  pro: {
    name: 'pro',
    displayName: 'CREATOR',
    description: 'Build & Earn',
    pricing: {
      GBP: { amount: 6.99, display: '£6.99' },
      USD: { amount: 7.99, display: '$7.99' },
      EUR: { amount: 7.99, display: '€7.99' }
    },
    recommended: true
  },
  
  unlimited: {
    name: 'unlimited',
    displayName: 'PROFESSIONAL',
    description: 'Go Pro & Scale',
    pricing: {
      GBP: { amount: 11.99, display: '£11.99' },
      USD: { amount: 14.99, display: '$14.99' },
      EUR: { amount: 14.99, display: '€14.99' }
    }
  }
};

/**
 * Error types and messages
 */
const ERROR_TYPES = {
  INVALID_TIER: {
    code: 'INVALID_TIER',
    userMessage: 'Please select a valid subscription plan',
    retryable: false
  },
  
  INVALID_CURRENCY: {
    code: 'INVALID_CURRENCY',
    userMessage: 'Currency not supported',
    retryable: false
  },
  
  NOT_AUTHENTICATED: {
    code: 'NOT_AUTHENTICATED',
    userMessage: 'Please sign in to upgrade your account',
    retryable: false
  },
  
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    userMessage: 'Connection failed. Please check your internet and try again.',
    retryable: true
  },
  
  API_ERROR: {
    code: 'API_ERROR',
    userMessage: 'Service temporarily unavailable. Please try again in a moment.',
    retryable: true
  },
  
  PROVIDER_UNAVAILABLE: {
    code: 'PROVIDER_UNAVAILABLE',
    userMessage: 'Payment system temporarily unavailable. Please try another method or contact support.',
    retryable: false
  },
  
  CONFIGURATION_ERROR: {
    code: 'CONFIGURATION_ERROR',
    userMessage: 'System configuration error. Please contact support.',
    retryable: false
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Validate checkout options
 */
function validateOptions(options) {
  const errors = [];
  const warnings = [];
  
  // Required: tier
  if (!options.tier) {
    errors.push('tier is required');
  } else if (!TIER_CONFIG[options.tier]) {
    errors.push(`Invalid tier: ${options.tier}. Valid tiers: ${Object.keys(TIER_CONFIG).join(', ')}`);
  }
  
  // Optional: currency (validate if provided)
  if (options.currency) {
    const validCurrencies = ['GBP', 'USD', 'EUR'];
    if (!validCurrencies.includes(options.currency)) {
      warnings.push(`Unsupported currency: ${options.currency}, defaulting to GBP`);
      options.currency = 'GBP';
    }
  } else {
    options.currency = 'GBP'; // Default
  }
  
  // Optional: provider (validate if provided)
  if (options.provider) {
    if (!PROVIDER_CONFIG[options.provider]) {
      warnings.push(`Unknown provider: ${options.provider}, defaulting to stripe`);
      options.provider = 'stripe';
    } else if (!PROVIDER_CONFIG[options.provider].enabled) {
      warnings.push(`Provider ${options.provider} not enabled, defaulting to stripe`);
      options.provider = 'stripe';
    }
  } else {
    options.provider = 'stripe'; // Default
  }
  
  return { valid: errors.length === 0, errors, warnings, options };
}

/**
 * Create error response
 */
function createErrorResponse(errorType, details = {}) {
  return {
    success: false,
    error: {
      code: errorType.code,
      userMessage: errorType.userMessage,
      retryable: errorType.retryable,
      details: details,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Log to console in development
 */
function log(message, data = {}) {
  if (ENV_CONFIG.detectEnvironment() === 'development') {
    console.log(`[PaymentRouter] ${message}`, data);
  }
}

/**
 * Log warning
 */
function warn(message, data = {}) {
  console.warn(`[PaymentRouter] ${message}`, data);
}

/**
 * Log error
 */
function logError(message, error = {}) {
  console.error(`[PaymentRouter] ${message}`, error);
}

// ============================================================================
// PROVIDER INSTANCES
// ============================================================================

let stripeProvider = null;
let paypalProvider = null;

/**
 * Get or create Stripe provider instance
 */
function getStripeProvider() {
  if (!stripeProvider) {
    stripeProvider = new StripeProvider({
      config: PROVIDER_CONFIG.stripe,
      envConfig: ENV_CONFIG
    });
  }
  return stripeProvider;
}

/**
 * Get or create PayPal provider instance
 */
function getPayPalProvider() {
  if (!paypalProvider) {
    paypalProvider = new PayPalProvider({
      config: PROVIDER_CONFIG.paypal,
      envConfig: ENV_CONFIG
    });
  }
  return paypalProvider;
}

/**
 * Get provider by name
 */
function getProvider(providerName) {
  switch (providerName) {
    case 'stripe':
      return getStripeProvider();
    case 'paypal':
      return getPayPalProvider();
    default:
      warn(`Unknown provider: ${providerName}, using Stripe`);
      return getStripeProvider();
  }
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

/**
 * PaymentRouter - Main service class
 */
class PaymentRouter {
  /**
   * Redirect user to payment checkout
   * 
   * @param {Object} options - Checkout options
   * @param {string} options.tier - Subscription tier (starter|pro|unlimited)
   * @param {string} [options.provider='stripe'] - Payment provider (stripe|paypal)
   * @param {string} [options.currency='GBP'] - Currency code (GBP|USD|EUR)
   * @param {string} [options.triggerSource] - Where redirect originated (for analytics)
   * @param {Object} [options.metadata] - Additional metadata to pass to provider
   * @returns {Promise<Object>} Success response or error (only returns on error, otherwise redirects)
   */
  static async redirectToCheckout(options = {}) {
    try {
      // 1. Log the request
      log('redirectToCheckout called', { options });
      
      // 2. Validate options
      const validation = validateOptions(options);
      
      // Log warnings
      validation.warnings.forEach(warning => warn(warning));
      
      // Return errors
      if (!validation.valid) {
        const errorMsg = validation.errors.join(', ');
        logError('Validation failed', { errors: validation.errors });
        return createErrorResponse(ERROR_TYPES.INVALID_TIER, { 
          validationErrors: validation.errors 
        });
      }
      
      // Use validated options
      const validatedOptions = validation.options;
      
      // 3. Check authentication
      const token = getAuthToken();
      if (!token) {
        logError('Not authenticated');
        return createErrorResponse(ERROR_TYPES.NOT_AUTHENTICATED);
      }
      
      // 4. Get provider
      const provider = getProvider(validatedOptions.provider);
      
      // 5. Create checkout session via provider
      const result = await provider.createCheckoutSession({
        tier: validatedOptions.tier,
        currency: validatedOptions.currency,
        triggerSource: validatedOptions.triggerSource,
        metadata: validatedOptions.metadata,
        token: token
      });
      
      // 6. Handle provider response
      if (!result.success) {
        logError('Provider failed', result.error);
        return result; // Provider already formatted error
      }
      
      // 7. Preserve context before redirect
      if (validatedOptions.triggerSource || validatedOptions.metadata) {
        this.preserveContext({
          triggerSource: validatedOptions.triggerSource,
          metadata: validatedOptions.metadata,
          tier: validatedOptions.tier,
          timestamp: Date.now()
        });
      }
      
      // 8. Log success and redirect
      log('Redirecting to checkout', { 
        url: result.checkoutUrl,
        provider: validatedOptions.provider 
      });
      
      window.location.href = result.checkoutUrl;
      
      // Code after this only runs if redirect fails
      return result;
      
    } catch (error) {
      logError('Unexpected error in redirectToCheckout', error);
      return createErrorResponse(ERROR_TYPES.API_ERROR, {
        originalError: error.message
      });
    }
  }
  
  /**
   * Generate checkout URL without redirecting
   * Useful for testing or preview
   * 
   * @param {Object} options - Same as redirectToCheckout
   * @returns {Promise<Object>} { success: boolean, url?: string, error?: Object }
   */
  static async getCheckoutUrl(options = {}) {
    try {
      log('getCheckoutUrl called', { options });
      
      // Validate options
      const validation = validateOptions(options);
      validation.warnings.forEach(warning => warn(warning));
      
      if (!validation.valid) {
        logError('Validation failed', { errors: validation.errors });
        return createErrorResponse(ERROR_TYPES.INVALID_TIER, { 
          validationErrors: validation.errors 
        });
      }
      
      const validatedOptions = validation.options;
      
      // Check authentication
      const token = getAuthToken();
      if (!token) {
        logError('Not authenticated');
        return createErrorResponse(ERROR_TYPES.NOT_AUTHENTICATED);
      }
      
      // Get provider and create session
      const provider = getProvider(validatedOptions.provider);
      const result = await provider.createCheckoutSession({
        tier: validatedOptions.tier,
        currency: validatedOptions.currency,
        triggerSource: validatedOptions.triggerSource,
        metadata: validatedOptions.metadata,
        token: token
      });
      
      if (result.success) {
        return {
          success: true,
          url: result.checkoutUrl,
          sessionId: result.sessionId,
          tierDisplay: result.tierDisplay
        };
      }
      
      return result;
      
    } catch (error) {
      logError('Unexpected error in getCheckoutUrl', error);
      return createErrorResponse(ERROR_TYPES.API_ERROR, {
        originalError: error.message
      });
    }
  }
  
  /**
   * Quick upgrade helper - common use case
   * 
   * @param {string} tier - Subscription tier
   * @param {string} [triggerSource='manual'] - Where upgrade was triggered
   * @returns {Promise<Object>} Success response or error
   */
  static async quickUpgrade(tier, triggerSource = 'manual') {
    return this.redirectToCheckout({
      tier,
      triggerSource
    });
  }
  
  /**
   * Get current environment configuration
   * 
   * @returns {Object} Environment details
   */
  static getEnvironment() {
    const env = ENV_CONFIG.detectEnvironment();
    const apiBase = ENV_CONFIG.getApiBase();
    const frontendBase = ENV_CONFIG.getFrontendBase();
    
    return {
      name: env,
      apiBase,
      frontendBase,
      isDevelopment: env === 'development',
      isStaging: env === 'staging',
      isProduction: env === 'production'
    };
  }
  
  /**
   * Validate system configuration
   * 
   * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
   */
  static validateConfiguration() {
    const errors = [];
    const warnings = [];
    
    // Check environment detection
    try {
      const env = this.getEnvironment();
      if (!env.name) {
        errors.push('Failed to detect environment');
      }
      if (!env.apiBase) {
        errors.push('API base URL not configured');
      }
    } catch (error) {
      errors.push(`Environment detection failed: ${error.message}`);
    }
    
    // Check authentication
    const token = getAuthToken();
    if (!token) {
      warnings.push('No authentication token found');
    }
    
    // Check providers
    const enabledProviders = Object.entries(PROVIDER_CONFIG)
      .filter(([_, config]) => config.enabled);
    
    if (enabledProviders.length === 0) {
      errors.push('No payment providers enabled');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get available payment providers
   * 
   * @returns {Array<Object>} Provider availability information
   */
  static getAvailableProviders() {
    return Object.entries(PROVIDER_CONFIG).map(([key, config]) => ({
      name: key,
      displayName: config.name,
      enabled: config.enabled,
      supportedCurrencies: config.supportedCurrencies
    }));
  }
  
  /**
   * Preserve context before redirect (for return journey)
   * 
   * @param {Object} context - Context to preserve
   * @returns {string} Context ID
   */
  static preserveContext(context) {
    try {
      const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const contextData = {
        ...context,
        contextId,
        savedAt: new Date().toISOString()
      };
      
      sessionStorage.setItem(`payment_context_${contextId}`, JSON.stringify(contextData));
      log('Context preserved', { contextId });
      
      return contextId;
    } catch (error) {
      warn('Failed to preserve context', error);
      return null;
    }
  }
  
  /**
   * Restore context after redirect
   * 
   * @param {string} contextId - Context ID from URL
   * @returns {Object|null} Restored context
   */
  static restoreContext(contextId) {
    try {
      const key = `payment_context_${contextId}`;
      const contextData = sessionStorage.getItem(key);
      
      if (!contextData) {
        return null;
      }
      
      const context = JSON.parse(contextData);
      
      // Clean up after restoration
      sessionStorage.removeItem(key);
      
      log('Context restored', { contextId });
      return context;
      
    } catch (error) {
      warn('Failed to restore context', error);
      return null;
    }
  }
  
  /**
   * Check if system is in test mode
   * 
   * @returns {boolean}
   */
  static isTestMode() {
    return ENV_CONFIG.detectEnvironment() === 'development';
  }
  
  /**
   * Get health status of payment system
   * 
   * @returns {Promise<Object>} Health check results
   */
  static async healthCheck() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: this.getEnvironment(),
      providers: {},
      configuration: this.validateConfiguration()
    };
    
    // Check each enabled provider
    for (const [key, config] of Object.entries(PROVIDER_CONFIG)) {
      if (config.enabled) {
        try {
          const provider = getProvider(key);
          const health = await provider.healthCheck();
          results.providers[key] = {
            ...health,
            available: health.status === 'healthy'
          };
        } catch (error) {
          results.providers[key] = {
            status: 'error',
            available: false,
            error: error.message
          };
        }
      } else {
        results.providers[key] = {
          status: 'disabled',
          available: false
        };
      }
    }
    
    // Determine overall status
    const anyProviderHealthy = Object.values(results.providers)
      .some(p => p.available);
    
    if (!anyProviderHealthy) {
      results.status = 'unhealthy';
    } else if (results.configuration.errors.length > 0) {
      results.status = 'degraded';
    }
    
    return results;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PaymentRouter;
export { TIER_CONFIG, PROVIDER_CONFIG, ERROR_TYPES };