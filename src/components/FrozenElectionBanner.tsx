import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

interface FrozenElectionBannerProps {
  show: boolean;
  variant?: 'banner' | 'inline' | 'badge';
  className?: string;
}

/**
 * Component to display election frozen status
 * 
 * @example
 * <FrozenElectionBanner show={isFrozen} variant="banner" />
 */
export const FrozenElectionBanner: React.FC<FrozenElectionBannerProps> = ({ 
  show, 
  variant = 'banner',
  className = '' 
}) => {
  if (!show) return null;

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium ${className}`}>
        <Lock className="w-3 h-3" />
        Frozen
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 p-2 rounded bg-amber-50 text-amber-800 text-sm ${className}`}>
        <Lock className="w-4 h-4 flex-shrink-0" />
        <span>Read-only mode (Frozen)</span>
      </div>
    );
  }

  // banner variant (default)
  return (
    <div className={`bg-amber-50 border-l-4 border-amber-400 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Election is Frozen
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              This election is currently frozen and in read-only mode. 
              No data modifications are allowed. You can view all information 
              but cannot create, update, or delete any records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrozenElectionBanner;
