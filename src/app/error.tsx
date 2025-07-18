'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h2 className="text-4xl font-bold text-red-500 mb-4">Something went wrong!</h2>
      <p className="text-lg text-gray-400 mb-8">
        We apologize for the inconvenience. Please try again later.
      </p>
      <button
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => { reset(); }
        }
      >
        Try again
      </button>
    </div>
  );
}
