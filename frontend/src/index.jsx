import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 600, margin: '60px auto', background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#c62828', margin: '0 0 12px' }}>Something went wrong</h2>
          <pre style={{ background: '#ffeaea', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto', color: '#c62828' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 16, padding: '10px 24px', background: '#1a73e8',
            color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
          }}>Reload Page</button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
