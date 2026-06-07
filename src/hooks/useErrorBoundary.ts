import { useState, useCallback } from 'react';
import { handleError } from '../utils/errorHandler';

export const useErrorBoundary = () => {
  const [hasError, setHasError] = useState(false);

  const ErrorBoundary = useCallback((error: unknown) => {
    setHasError(true);
    handleError(error);
  }, []);

  const resetErrorBoundary = useCallback(() => {
    setHasError(false);
  }, []);

  return {
    hasError,
    ErrorBoundary,
    resetErrorBoundary
  };
};