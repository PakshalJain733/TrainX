import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: "2rem",
          fontFamily: "sans-serif"
        }}>
          <div style={{
            maxWidth: "500px",
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            padding: "2.5rem",
            textAlign: "center",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              color: "#ef4444",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              marginBottom: "1.25rem"
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.5rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.925rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              An error occurred in this view. You can reload the page or try going back.
            </p>
            {this.state.error && (
              <details style={{
                textAlign: "left",
                backgroundColor: "#f1f5f9",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                fontSize: "0.8rem",
                color: "#334155",
                overflowX: "auto"
              }}>
                <summary style={{ cursor: "pointer", fontWeight: "600", color: "#475569" }}>
                  Error details: {this.state.error.toString()}
                </summary>
                <pre style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  cursor: "pointer"
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  cursor: "pointer"
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
