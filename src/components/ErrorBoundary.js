// ============================================================================
// STEP 1: CREATE NEW FILE: src/components/ErrorBoundary.js
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 ErrorBoundary caught error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to backend or error tracking service (optional)
    try {
      // You could send to backend here:
      // fetch('/api/log-error', { method: 'POST', body: JSON.stringify({ error: error.toString(), errorInfo }) });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0B1426 0%, #1A2B47 50%, #0B1426 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '2px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            
            <h2 style={{
              color: '#ff6b6b',
              fontSize: '1.8rem',
              margin: '0 0 1rem 0'
            }}>
              Something Went Wrong
            </h2>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 2rem 0',
              lineHeight: 1.6
            }}>
              Don't worry - your data is safe. You can return home or try reloading the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                textAlign: 'left',
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', color: '#ff6b6b' }}>
                  Error Details (Dev Mode)
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: 700,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer'
                }}
              >
                Go to Homepage
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;