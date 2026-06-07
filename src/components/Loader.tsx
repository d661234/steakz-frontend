import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Loader: React.FC<LoaderProps> = ({ 
  fullScreen = false, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="animate-pulse">
          <Loader2 
            className={`${sizeClasses[size]} text-primary animate-spin`} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <Loader2 
        className={`${sizeClasses[size]} text-primary animate-spin`} 
      />
    </div>
  );
};

export default Loader;