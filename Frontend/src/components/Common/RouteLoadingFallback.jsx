import React from 'react';

/**
 * Enterprise Route-level Loading Fallback.
 * Renders smooth skeleton pulse animation during React.lazy chunk resolution.
 */
export default function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
        padding: '32px',
        boxSizing: 'border-box',
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          border: '3.5px solid #e2e8f0',
          borderTopColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'spin 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />
      <p
        style={{
          marginTop: '16px',
          fontSize: '13.5px',
          fontWeight: 600,
          color: '#64748b',
          letterSpacing: '-0.2px',
        }}
      >
        Loading workspace module...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
