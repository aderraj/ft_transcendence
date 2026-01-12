import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0b1021] text-white">
          <h1 className="text-3xl font-bold mb-4 text-cyan-400">System Malfunction</h1>
          <p className="mb-4 text-white/60">The application encountered a critical error.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-cyan-600 rounded-xl hover:bg-cyan-500 transition"
          >
            Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;