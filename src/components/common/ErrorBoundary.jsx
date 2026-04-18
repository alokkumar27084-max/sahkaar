import React from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[62vh] flex items-center justify-center px-4">
          <div className="max-w-md text-center glass-card p-8 rounded-2xl border border-[var(--color-border)]">
            <h1 className="font-display text-2xl font-bold text-[var(--color-heading)] mb-2">Something went wrong</h1>
            <p className="text-[var(--color-muted)] text-sm mb-6">
              Please refresh the page or return home. If the problem persists, contact support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
              <Link to="/" className="btn-secondary inline-flex items-center justify-center">
                Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
