import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('SPOC portal crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{ maxWidth: '460px', padding: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Something went wrong</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              The page could not be rendered. Reload to try again.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
