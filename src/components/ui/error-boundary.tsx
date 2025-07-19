'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: string | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error, 
      errorInfo: null 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ 
      hasError: true, 
      error, 
      errorInfo 
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  }

  render() {
    if (this.state.hasError) {
      const DefaultErrorUI = ({ error, onRetry }: { error: Error, onRetry: () => void }) => (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive p-4">
          <AlertTriangle className="w-16 h-16 mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <Button onClick={onRetry} variant="destructive">
            Retry
          </Button>
        </div>
      );

      // Handle different fallback types
      if (typeof this.props.fallback === 'string') {
        return <DefaultErrorUI error={this.state.error!} onRetry={this.handleRetry} />;
      }

      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.handleRetry);
      }

      return <DefaultErrorUI error={this.state.error!} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
} 