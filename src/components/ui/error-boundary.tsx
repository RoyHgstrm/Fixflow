'use client';

import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Button } from './button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import type { Result, ApiError } from '@/lib/types';
import { ApiErrorCode } from '@/lib/types';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Error logging service
class ErrorLogger {
  static log(error: Error, errorInfo?: React.ErrorInfo, context?: string) {
    // In production, send to logging service (e.g., Sentry, LogRocket)
    console.error('Error Boundary caught an error:', {
      error,
      errorInfo,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Here you would typically send to your error tracking service
    // Example: Sentry.captureException(error, { extra: { errorInfo, context } });
  }
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error
    ErrorLogger.log(error, errorInfo, 'React Error Boundary');

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleRetry);
      }

      return <DefaultErrorUI error={this.state.error!} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Default error UI component
interface DefaultErrorUIProps {
  error: Error;
  onRetry: () => void;
}

function DefaultErrorUI({ error, onRetry }: DefaultErrorUIProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {isNetworkError ? 'Connection Error' : 'Something went wrong'}
          </h1>
          <p className="text-muted-foreground">
            {isNetworkError
              ? 'Please check your internet connection and try again.'
              : 'An unexpected error occurred. Our team has been notified.'}
          </p>
        </div>

        {/* Development Error Details */}
        {isDevelopment && (
          <div className="text-left bg-muted p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Error Details (Development Only):</h3>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
              {error.message}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        {/* Contact Support */}
        <p className="text-sm text-muted-foreground">
          If the problem persists, please{' '}
          <a 
            href="mailto:support@fixflow.com" 
            className="text-primary hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}

// Hook for using Result pattern with error boundary
export function useErrorHandler() {
  const handleResult = function<T, E>(result: Result<T, E>): T {
    if (!result.success) {
      throw new Error(
        result.error instanceof Error 
          ? result.error.message 
          : String(result.error)
      );
    }
    return result.data;
  };

  const handleAsync = async function<T>(
    asyncFn: () => Promise<T>,
    errorMessage = 'An error occurred'
  ): Promise<Result<T, ApiError>> {
    try {
      const data = await asyncFn();
      return { success: true, data };
    } catch (error) {
      const apiError: ApiError = {
        code: ApiErrorCode.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : errorMessage,
        details: error,
      };
      return { success: false, error: apiError };
    }
  };

  return { handleResult, handleAsync };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
} 