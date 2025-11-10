// src/components/StoryMode/DefensiveStoryWrapper.jsx - Error Boundary
import React from 'react';
import styles from './StoryMode_module.css';

class DefensiveStoryWrapper extends React.Component {
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
    console.error('❌ Story Mode Error Boundary caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.storyModeContainer}>
          <div className={styles.criticalError}>
            <div className={styles.errorContent}>
              <h2>⚠️ Story Mode Error</h2>
              <p>Something went wrong in Story Mode. This is a temporary issue.</p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className={styles.errorDetails}>
                  <summary>Error Details (Dev Only)</summary>
                  <pre>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <button onClick={this.handleReset} className={styles.reloadButton}>
                Reload Story Mode
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DefensiveStoryWrapper;