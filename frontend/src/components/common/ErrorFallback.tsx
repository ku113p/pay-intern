import type { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        <button
          onClick={resetErrorBoundary}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
