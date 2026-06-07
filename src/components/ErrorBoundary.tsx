import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: undefined,
      errorInfo: undefined
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('Error caught by getDerivedStateFromError:', error);
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Optional: Send error to a logging service
    toast.error('An unexpected error occurred', {
      description: `${error.message}\n\nError Details: ${JSON.stringify(errorInfo)}`,
      duration: 5000,
    });

    this.setState({ 
      hasError: true,
      error,
      errorInfo 
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback or default
      const FallbackComponent = this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
            <h1 className="text-4xl font-bold text-red-600 mb-4">
              Something Went Wrong
            </h1>
            <p className="text-red-500 mb-4 text-left">
              <strong>Error:</strong> {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            {this.state.errorInfo && (
              <details className="text-left bg-gray-100 p-4 rounded-md mb-4 max-h-64 overflow-auto">
                <summary className="cursor-pointer text-gray-700">
                  Error Details
                </summary>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reload Page
              </button>
              <button 
                onClick={this.handleRetry}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );

      return FallbackComponent;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;