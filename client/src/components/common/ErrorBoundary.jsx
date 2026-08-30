import React from 'react';

/**
 * Top-level error boundary so a crash anywhere (e.g. the gallery fullscreen
 * overlay) shows a readable message instead of unmounting the whole tree to a
 * blank white page. Displays the error text + a reload button (fallback resets
 * React's internal error state, then hard-refreshes).
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to the browser console for diagnosis.
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      const message = this.state.error?.message || String(this.state.error);
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 px-6 text-center">
          <div className="max-w-md space-y-4">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className={`font-display font-bold text-2xl text-neutral-900 dark:text-white`}>
              Something went wrong
            </h1>
            <p className="font-mono text-[11px] leading-relaxed text-red-500 break-words">
              {message}
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;