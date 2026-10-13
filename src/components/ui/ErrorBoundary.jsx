import { Component } from 'react';

/** Catches rendering errors so a single broken screen never blanks the whole portal. */
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI error', error, info); }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card card-body" role="alert" style={{ margin: 24 }}>
        <h2>This screen hit a problem</h2>
        <p className="muted" style={{ margin: '8px 0 16px' }}>The rest of EmergencyLink is still working. You can reload this screen or return to the dashboard.</p>
        <div className="row">
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>Reload this screen</button>
          <a className="btn btn-secondary" href="/app">Go to dashboard</a>
        </div>
      </div>
    );
  }
}
