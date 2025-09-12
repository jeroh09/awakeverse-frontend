// components/UsageComponents.jsx - UI components for usage display
import React from 'react';

export const UsageWarningBanner = ({ warning, onUpgrade, onDismiss }) => {
  if (!warning) return null;

  const bannerStyles = {
    blocked: 'bg-red-50 border-l-4 border-red-400 text-red-800',
    critical: 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800', 
    warning: 'bg-blue-50 border-l-4 border-blue-400 text-blue-800'
  };

  return (
    <div className={`p-4 mb-4 ${bannerStyles[warning.type] || bannerStyles.warning}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium">{warning.message}</p>
        </div>
        
        <div className="flex gap-2 ml-4">
          {warning.action === 'upgrade_required' && (
            <button
              onClick={onUpgrade}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Upgrade Now
            </button>
          )}
          
          {warning.action === 'upgrade_suggested' && (
            <>
              <button
                onClick={onUpgrade}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Upgrade
              </button>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-gray-500 hover:text-gray-700 text-sm px-2"
                >
                  ×
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const BlockedInputOverlay = ({ upgradeInfo, onUpgrade, onBackToCharacters }) => {
  const { current_tier, recommended_tier, upgrade_benefits, limit_reached_message } = upgradeInfo || {};
  const benefits = upgrade_benefits?.[recommended_tier] || {};

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Monthly Limit Reached
          </h3>
          <p className="text-gray-600 text-sm">
            {limit_reached_message || `You've used all your ${current_tier} plan messages for custom characters this month.`}
          </p>
        </div>
        
        {benefits && Object.keys(benefits).length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Upgrade to {recommended_tier} and get:
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {benefits.characters && (
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {benefits.characters}
                </li>
              )}
              {benefits.messages && (
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {benefits.messages}
                </li>
              )}
            </ul>
            {benefits.price && (
              <div className="mt-3 p-2 bg-blue-50 rounded text-center">
                <span className="text-blue-700 font-semibold">
                  {benefits.price}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade to {recommended_tier || 'Premium'}
          </button>
          
          <button
            onClick={onBackToCharacters}
            className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Browse Other Characters
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Your conversation will be saved and available after upgrading.
        </p>
      </div>
    </div>
  );
};
