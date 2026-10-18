import React from 'react';

/**
 * Sleek Top-of-Page Progress Indicator.
 * Completely replaces disruptive full-page spinners and 'Loading workspace module...' screens
 * with a high-performance, non-intrusive progress bar at the top of the viewport.
 */
export default function RouteLoadingFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        zIndex: 999999,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      role="status"
      aria-label="Loading..."
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #4f46e5 0%, #3b82f6 50%, #06b6d4 100%)',
          animation: 'routeProgressPulse 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          boxShadow: '0 0 10px rgba(79, 70, 229, 0.6), 0 0 4px rgba(59, 130, 246, 0.5)',
        }}
      />
      <style>{`
        @keyframes routeProgressPulse {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
