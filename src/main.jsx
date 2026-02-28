import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>POS Application Crashed!</h1>
          <p>Hệ thống gặp lỗi nội bộ. Vui lòng chụp màn hình lỗi bên dưới và gửi cho nhà phát triển.</p>
          <hr style={{ margin: '15px 0', borderColor: '#fca5a5' }} />
          <h3 style={{ fontWeight: 'bold' }}>Error Message:</h3>
          <p style={{ background: '#fecaca', padding: '10px', borderRadius: '5px' }}>{this.state.error?.toString()}</p>
          <h3 style={{ fontWeight: 'bold', marginTop: '15px' }}>Component Stack Trace:</h3>
          <pre style={{ background: '#fecaca', padding: '10px', borderRadius: '5px', overflowX: 'auto', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Xoá Dữ Liệu Cache & Đăng Xuất
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
